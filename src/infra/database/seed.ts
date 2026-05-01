import { db } from './client.ts';
import { logger } from '../../shared/logger.ts';
import { sql } from 'kysely';

if (process.env.NODE_ENV === 'production') {
  logger.error('Cannot run seed in production environment!');
  process.exit(1);
}

async function seed() {
  logger.info('Starting database seed...');

  try {
    // Truncate tables to ensure idempotency
    logger.info('Truncating tables...');
    await sql`TRUNCATE TABLE users, collections, sources, editions CASCADE`.execute(
      db,
    );

    logger.info('Inserting users...');
    const defaultPassword = await Bun.password.hash('senha123');

    await db
      .insertInto('users')
      .values([
        {
          name: 'Admin Manager',
          email: 'manager@teste.com',
          password_hash: defaultPassword,
          role: 'manager',
        },
        {
          name: 'Reader User',
          email: 'reader@teste.com',
          password_hash: defaultPassword,
          role: 'reader',
        },
      ])
      .execute();

    logger.info('Inserting collections...');
    const collections = await db
      .insertInto('collections')
      .values([
        {
          name: 'Acervo Histórico da UTFPR',
          description:
            'Documentos, revistas e jornais institucionais da UTFPR.',
          institution: 'Universidade Tecnológica Federal do Paraná',
        },
        {
          name: 'Jornais Locais de Curitiba',
          description:
            'Acervo contendo jornais do início do século 20 circulados em Curitiba.',
          institution: 'Biblioteca Pública do Paraná',
        },
      ])
      .returning('id')
      .execute();

    logger.info('Inserting sources...');
    const sources = await db
      .insertInto('sources')
      .values([
        {
          name: 'Revista Tecnologia e Sociedade',
          type: 'magazine',
          language: 'pt-BR',
          collection_id: collections[0].id,
          metadata: JSON.stringify({ publisher: 'UTFPR' }),
        },
        {
          name: 'O Diário do Paraná',
          type: 'newspaper',
          language: 'pt-BR',
          collection_id: collections[1].id,
          metadata: JSON.stringify({ frequency: 'daily' }),
        },
      ])
      .returning('id')
      .execute();

    logger.info('Inserting editions...');
    await db
      .insertInto('editions')
      .values([
        {
          source_id: sources[0].id,
          number: 'Vol 1. Num 1.',
          notes: 'Primeira edição da revista.',
          published_at: new Date('2000-01-01'),
        },
        {
          source_id: sources[1].id,
          number: 'Edição 154',
          notes: 'Edição comemorativa do aniversário da cidade.',
          published_at: new Date('1950-03-29'),
        },
      ])
      .execute();

    logger.info('Database seed completed successfully!');
  } catch (error) {
    logger.error({ err: error }, 'Failed to seed database');
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

seed();
