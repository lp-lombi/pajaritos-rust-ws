import 'reflect-metadata';
import * as readline from 'readline';
import { AppDataSource } from './database/connection';
import { Role } from './entities/Role';
import { User } from './entities/User';
import { hashPassword } from './utils/passwordUtils';

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function seedDatabase() {
  await AppDataSource.initialize();

  const roleRepository = AppDataSource.getRepository(Role);
  const userRepository = AppDataSource.getRepository(User);
  const rl = createReadlineInterface();

  try {
    // Crear roles si no existen
    let adminRole = await roleRepository.findOne({ where: { descripcion: 'admin' } });
    if (!adminRole) {
      adminRole = roleRepository.create({ descripcion: 'admin' });
      await roleRepository.save(adminRole);
      console.log('✓ Rol admin creado');
    }

    let playerRole = await roleRepository.findOne({ where: { descripcion: 'player' } });
    if (!playerRole) {
      playerRole = roleRepository.create({ descripcion: 'player' });
      await roleRepository.save(playerRole);
      console.log('✓ Rol player creado');
    }

    // Crear usuario admin si no existe
    const existingAdmin = await userRepository.findOne({ where: { username: 'admin' } });
    if (!existingAdmin) {
      console.log('\n--- Configurar usuario admin ---');
      let username = '';
      let password = '';

      // Pedir username
      do {
        username = await question(rl, 'Ingrese nombre de usuario para admin: ');
        if (!username) {
          console.log('⚠ El nombre de usuario no puede estar vacío');
        }
      } while (!username);

      // Verificar si el usuario ya existe
      const userExists = await userRepository.findOne({ where: { username } });
      if (userExists) {
        console.log(`⚠ El usuario "${username}" ya existe`);
        rl.close();
        return;
      }

      // Pedir contraseña
      do {
        password = await question(rl, 'Ingrese contraseña para admin: ');
        if (!password) {
          console.log('⚠ La contraseña no puede estar vacía');
        }
      } while (!password);

      const hashedPassword = await hashPassword(password);
      const admin = userRepository.create({
        username,
        password: hashedPassword,
        roleId: adminRole.id,
        role: adminRole,
      });
      await userRepository.save(admin);
      console.log(`✓ Usuario admin "${username}" creado correctamente`);
    } else {
      console.log(`ℹ Usuario admin "admin" ya existe`);
    }

    console.log('\n✓ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  } finally {
    rl.close();
    await AppDataSource.destroy();
  }
}

seedDatabase();
