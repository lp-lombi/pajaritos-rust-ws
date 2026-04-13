import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { AppDataSource } from './database/connection';
import { User } from './entities/User';
import { Player } from './entities/Player';
import { Role } from './entities/Role';
import { Subscription } from './entities/Subscription';
import { comparePasswords } from './utils/passwordUtils';
import { hashPassword } from './utils/passwordUtils';
import { RustRcon } from './utils/rustRcon';

const SUBSCRIPTION_VALIDITY_DAYS = 30;

const RCON_HOST = process.env.RCON_HOST || '187.77.235.159';
const RCON_PORT = Number(process.env.RCON_PORT || '28017');
const RCON_PASSWORD = "ignamelacome";
const RCON_RECONNECT_MS = 5000;
const MAX_CHAT_MESSAGES = 200;
const rcon = new RustRcon({
  host: RCON_HOST,
  port: RCON_PORT,
  password: RCON_PASSWORD,
  reconnectMs: RCON_RECONNECT_MS,
  maxChatMessages: MAX_CHAT_MESSAGES,
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

const frontendBuildPath = path.resolve(__dirname, '..', 'public');
app.use(express.static(frontendBuildPath));

// Inicializar base de datos
AppDataSource.initialize()
  .then(() => {
    console.log('Base de datos conectada');

    function mapUserResponse(user: User) {
      return {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    }

    // Rutas básicas
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    });


    app.get("/api/rust/health", (req, res) => {
        res.json({
            connected: rcon.connected,
            playerCount: rcon.playerCount,
            chatMessagesCount: rcon.chatMessages.length,
        });
    });

    app.get('/api/rust/players', (req, res) => {
      rcon.updateData();

      res.json({
        connected: rcon.connected,
        playerCount: rcon.playerCount,
        players: rcon.playersList,
      });
    });

    app.get('/api/rust/chat', (req, res) => {
      rcon.updateData();

      res.json({
        connected: rcon.connected,
        count: rcon.chatMessages.length,
        messages: rcon.chatMessages,
      });
    });

    app.post('/api/rust/command', async (req, res) => {
      const command = typeof req.body?.command === 'string' ? req.body.command.trim() : '';

      if (!command) {
        return res.status(400).json({ error: 'El campo "command" es obligatorio' });
      }

      if (!rcon.connected) {
        return res.status(503).json({ error: 'RCON desconectado' });
      }

      try {
        const response = await rcon.sendCommand(command, true);
        return res.json({ ok: true, response });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sin respuesta del RCON';
        return res.status(504).json({ ok: false, error: message });
      }
    });

    app.post('/api/rust/chat', (req, res) => {
      const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

      if (!message) {
        return res.status(400).json({ error: 'El campo "message" es obligatorio' });
      }

      if (!rcon.connected) {
        return res.status(503).json({ error: 'RCON desconectado' });
      }

      const escapedMessage = message.replace(/"/g, '\\"');
      const sent = rcon.sendCommand(`say "${escapedMessage}"`);

      if (!sent) {
        return res.status(503).json({ error: 'RCON desconectado' });
      }

      return res.status(201).json({ ok: true });
    });

    // Ruta de registro
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { username, password, roleId } = req.body;

        const normalizedUsername = typeof username === 'string' ? username.trim() : '';
        const normalizedPassword = typeof password === 'string' ? password.trim() : '';

        if (!normalizedUsername || !normalizedPassword) {
          return res.status(400).json({ error: 'Username y password son requeridos' });
        }

        if (normalizedPassword.length < 6) {
          return res.status(400).json({ error: 'La password debe tener al menos 6 caracteres' });
        }

        const userRepository = AppDataSource.getRepository(User);
        const roleRepository = AppDataSource.getRepository(Role);

        const existingUser = await userRepository.findOne({
          where: { username: normalizedUsername },
        });

        if (existingUser) {
          return res.status(409).json({ error: 'Ya existe un usuario con ese username' });
        }

        let role = null;

        if (roleId) {
          role = await roleRepository.findOne({ where: { id: Number(roleId) } });

          if (!role) {
            return res.status(400).json({ error: 'El rol indicado no existe' });
          }
        } else {
          role = await roleRepository.findOne({ where: { descripcion: 'player' } });

          if (!role) {
            return res.status(500).json({ error: 'No se pudo resolver el rol por defecto' });
          }
        }

        const hashedPassword = await hashPassword(normalizedPassword);
        const newUser = userRepository.create({
          username: normalizedUsername,
          password: hashedPassword,
          roleId: role.id,
          role,
        });

        const savedUser = await userRepository.save(newUser);

        res.status(201).json(mapUserResponse(savedUser));
      } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
      }
    });

    // Ruta de login
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          return res.status(400).json({ error: 'Username y password son requeridos' });
        }

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
          where: { username },
          relations: ['role'],
        });

        if (!user) {
          return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const isPasswordValid = await comparePasswords(password, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // En una aplicación real, aquí generarías un JWT
        res.json(mapUserResponse(user));
      } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
      }
    });

    // Ruta para obtener todos los players
    app.get('/api/players', async (req, res) => {
      try {
        const playerRepository = AppDataSource.getRepository(Player);
        const players = await playerRepository.find({ relations: ['subscription'] });
        res.json(players);
      } catch (error) {
        console.error('Error al obtener players:', error);
        res.status(500).json({ error: 'Error en el servidor' });
      }
    });

    // Ruta para crear un player
    app.post('/api/players', async (req, res) => {
      try {
        const normalizedSteamid = typeof req.body?.steamid === 'string' ? req.body.steamid.trim() : '';
        const normalizedTag = typeof req.body?.tag === 'string' ? req.body.tag.trim() : '';
        const loadSubscription = req.body?.loadSubscription === true;

        if (!normalizedSteamid || !normalizedTag) {
          return res.status(400).json({ error: 'steamid y tag son requeridos' });
        }

        if (!/^\d{17}$/.test(normalizedSteamid)) {
          return res.status(400).json({ error: 'El steamid debe tener exactamente 17 digitos' });
        }

        const playerRepository = AppDataSource.getRepository(Player);
        const existingPlayer = await playerRepository.findOne({ where: { steamid: normalizedSteamid } });

        if (existingPlayer) {
          return res.status(409).json({ error: 'Ya existe un player con ese steamid' });
        }

        const savedPlayer = await AppDataSource.manager.transaction(async (manager) => {
          const transactionalPlayerRepository = manager.getRepository(Player);
          const transactionalSubscriptionRepository = manager.getRepository(Subscription);

          const newPlayer = transactionalPlayerRepository.create({
            steamid: normalizedSteamid,
            tag: normalizedTag,
          });
          const createdPlayer = await transactionalPlayerRepository.save(newPlayer);

          if (!loadSubscription) {
            return createdPlayer;
          }

          const validFrom = new Date();
          const validUntil = new Date(validFrom);
          validUntil.setDate(validUntil.getDate() + SUBSCRIPTION_VALIDITY_DAYS);

          const newSubscription = transactionalSubscriptionRepository.create({
            validFrom,
            validUntil,
            playerId: createdPlayer.id,
          });
          const savedSubscription = await transactionalSubscriptionRepository.save(newSubscription);

          return {
            ...createdPlayer,
            subscription: savedSubscription,
          };
        });

        res.status(201).json(savedPlayer);
      } catch (error) {
        console.error('Error al crear player:', error);
        res.status(500).json({ error: 'Error en el servidor' });
      }
    });

    // Ruta para actualizar datos de un player (tag y suscripcion)
    app.patch('/api/players/:id', async (req, res) => {
      try {
        const playerId = Number(req.params.id);
        const normalizedTag = typeof req.body?.tag === 'string' ? req.body.tag.trim() : undefined;
        const hasSubscriptionField = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'subscription');
        const subscriptionInput = hasSubscriptionField ? req.body.subscription : undefined;

        if (!Number.isInteger(playerId) || playerId <= 0) {
          return res.status(400).json({ error: 'Id de player invalido' });
        }

        if (normalizedTag !== undefined && !normalizedTag) {
          return res.status(400).json({ error: 'El tag no puede estar vacio' });
        }

        if (normalizedTag === undefined && subscriptionInput === undefined) {
          return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        const updatedPlayer = await AppDataSource.manager.transaction(async (manager) => {
          const playerRepository = manager.getRepository(Player);
          const subscriptionRepository = manager.getRepository(Subscription);
          const player = await playerRepository.findOne({
            where: { id: playerId },
            relations: ['subscription'],
          });

          if (!player) {
            return null;
          }

          if (normalizedTag !== undefined) {
            player.tag = normalizedTag;
            await playerRepository.save(player);
          }

          if (subscriptionInput !== undefined) {
            if (subscriptionInput === null) {
              if (player.subscription) {
                await subscriptionRepository.delete({ playerId: player.id });
              }
            } else {
              const validFromRaw = typeof subscriptionInput?.validFrom === 'string'
                ? subscriptionInput.validFrom.trim()
                : '';
              const validUntilRaw = typeof subscriptionInput?.validUntil === 'string'
                ? subscriptionInput.validUntil.trim()
                : '';

              if (!validFromRaw || !validUntilRaw) {
                throw new Error('invalid_subscription_dates');
              }

              const validFrom = new Date(validFromRaw);
              const validUntil = new Date(validUntilRaw);

              if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime())) {
                throw new Error('invalid_subscription_dates');
              }

              if (validFrom > validUntil) {
                throw new Error('invalid_subscription_range');
              }

              if (player.subscription) {
                player.subscription.validFrom = validFrom;
                player.subscription.validUntil = validUntil;
                await subscriptionRepository.save(player.subscription);
              } else {
                const newSubscription = subscriptionRepository.create({
                  playerId: player.id,
                  validFrom,
                  validUntil,
                });
                await subscriptionRepository.save(newSubscription);
              }
            }
          }

          return await playerRepository.findOne({
            where: { id: playerId },
            relations: ['subscription'],
          });
        });

        if (!updatedPlayer) {
          return res.status(404).json({ error: 'Player no encontrado' });
        }

        res.json(updatedPlayer);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'invalid_subscription_dates') {
            return res.status(400).json({ error: 'validFrom y validUntil son requeridos' });
          }

          if (error.message === 'invalid_subscription_range') {
            return res.status(400).json({ error: 'validFrom no puede ser mayor que validUntil' });
          }
        }

        console.error('Error al actualizar player:', error);
        res.status(500).json({ error: 'Error en el servidor' });
      }
    });

    // Ruta para borrar un player
    app.delete('/api/players/:id', async (req, res) => {
      try {
        const playerId = Number(req.params.id);

        if (!Number.isInteger(playerId) || playerId <= 0) {
          return res.status(400).json({ error: 'Id de player invalido' });
        }

        const playerRepository = AppDataSource.getRepository(Player);
        const player = await playerRepository.findOne({ where: { id: playerId } });

        if (!player) {
          return res.status(404).json({ error: 'Player no encontrado' });
        }

        await playerRepository.delete(playerId);
        res.status(204).send();
      } catch (error) {
        console.error('Error al borrar player:', error);
        res.status(500).json({ error: 'Error en el servidor' });
      }
    });

    app.get('/', (req, res) => {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });

    app.listen(3001, () => {
      console.log('Servidor corriendo en puerto 3001');
    });

    rcon.connect();
  })
  .catch((error) => {
    console.error('Error al conectar la base de datos:', error);
    process.exit(1);
  });
