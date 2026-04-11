import 'reflect-metadata';
import { AppDataSource } from './database/connection';
import { Role } from './entities/Role';
import { User } from './entities/User';
import { hashPassword } from './utils/passwordUtils';

async function seedDatabase() {
  await AppDataSource.initialize();

  const roleRepository = AppDataSource.getRepository(Role);
  const userRepository = AppDataSource.getRepository(User);

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
      const hashedPassword = await hashPassword('admin123');
      const admin = userRepository.create({
        username: 'admin',
        password: hashedPassword,
        roleId: adminRole.id,
        role: adminRole,
      });
      await userRepository.save(admin);
      console.log('✓ Usuario admin creado');
    }

    console.log('\n✓ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedDatabase();
