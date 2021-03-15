import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import setupDB from '../../test-setup.js';
import { PreviousItem } from '../../models/item.model.js';

// init test database
setupDB('previous-items');
const request = supertest(app);

const createUniqueID = () => new mongoose.Types.ObjectId().toHexString();

const previousItems = [
  {
    _id: createUniqueID(),
    name: 'coffee',
    room: 'kitchen',
    location: 'main cupboard',
    lowStockAlert: true,
  },
  {
    _id: createUniqueID(),
    name: 'toilet cleaner',
    room: 'bathroom',
    location: 'under sink cupboard',
    lowStockAlert: true,
  },
  {
    _id: createUniqueID(),
    name: 'toothpaste',
    room: 'bathroom',
    location: 'under sink cupboard',
    lowStockAlert: true,
  },
];

describe('Test the previous items endpoint', () => {
  beforeEach(() => PreviousItem.insertMany(previousItems));

  test('get all items', async (done) => {
    expect.assertions(
      previousItems.length * (Object.keys(previousItems[0]).length - 1)
    );
    const response = await request.get('/previous-items').expect(200);
    for (const item of response.body) {
      const { name, room, location, lowStockAlert } = item;
      expect(name).toBeTruthy();
      expect(room).toBeTruthy();
      expect(location).toBeTruthy();
      expect(lowStockAlert).not.toBeNull();
    }
    done();
  });

  test('add item', async (done) => {
    expect.assertions(4);
    const item = {
      _id: createUniqueID(),
      name: 'hand soap',
      room: 'kitchen',
      location: 'under sink cupboard',
      lowStockAlert: true,
    };
    const response = await request
      .post('/previous-items/add')
      .send(item)
      .expect(200);
    const { name, room, location, lowStockAlert } = response.body;
    expect(name).toBeTruthy();
    expect(room).toBeTruthy();
    expect(location).toBeTruthy();
    expect(lowStockAlert).not.toBeNull();
    done();
  });

  test('delete item by id', async (done) => {
    expect.assertions(4);
    const { _id } = previousItems[0];
    const response = await request.delete(`/previous-items/${_id}`).expect(200);
    const { name, room, location, lowStockAlert } = response.body;
    expect(name).toBeTruthy();
    expect(room).toBeTruthy();
    expect(location).toBeTruthy();
    expect(lowStockAlert).not.toBeNull();
    done();
  });
});
