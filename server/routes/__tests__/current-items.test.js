import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import setupDB from '../../test-setup.js';
import { CurrentItem } from '../../models/item.model.js';

// init test database
setupDB('current-items');
const request = supertest(app);

const createUniqueID = () => new mongoose.Types.ObjectId().toHexString();

const currentItems = [
  {
    _id: createUniqueID(),
    name: 'beans',
    quantity: 5,
    room: 'kitchen',
    location: 'main cupboard',
    expirationDate: new Date(),
    lowStockAlert: false,
  },
  {
    _id: createUniqueID(),
    name: 'bleach',
    quantity: 2,
    room: 'kitchen',
    location: 'under sink cupboard',
    expirationDate: new Date(0),
    lowStockAlert: true,
  },
  {
    _id: createUniqueID(),
    name: 'beans',
    quantity: 5,
    room: 'kitchen',
    location: 'main cupboard',
    expirationDate: new Date(),
    lowStockAlert: false,
  },
];

describe('Test the current items endpoint', () => {
  beforeEach(() => CurrentItem.insertMany(currentItems));

  test('get all items', async (done) => {
    expect.assertions(
      currentItems.length * (Object.keys(currentItems[0]).length - 1)
    );
    const response = await request.get('/current-items').expect(200);
    for (const item of response.body) {
      const {
        name,
        quantity,
        room,
        location,
        expirationDate,
        lowStockAlert,
      } = item;
      expect(name).toBeTruthy();
      expect(quantity).toBeTruthy();
      expect(room).toBeTruthy();
      expect(location).toBeTruthy();
      expect(expirationDate).toBeTruthy();
      expect(lowStockAlert).not.toBeNull();
    }
    done();
  });

  test('get item by id', async (done) => {
    expect.assertions(Object.keys(currentItems[0]));
    const { _id } = currentItems[0];
    const response = await request.get(`/current-items/${_id}`).expect(200);
    const { name, room, location, lowStockAlert } = response.body;
    expect(name).toBeTruthy();
    expect(room).toBeTruthy();
    expect(location).toBeTruthy();
    expect(lowStockAlert).not.toBeNull();
    done();
  });

  test('add item', async (done) => {
    expect.assertions(1);
    const item = {
      _id: createUniqueID(),
      name: 'sweetcorn',
      quantity: 2,
      room: 'kitchen',
      location: 'main cupboard',
      expirationDate: new Date(),
      lowStockAlert: true,
    };
    const response = await request
      .post('/current-items/add')
      .send(item)
      .expect(200);
    expect(response.body).toBe(`${item.name} added.`);
    done();
  });

  test('update item by id', async (done) => {
    expect.assertions(1);
    const item = currentItems[1];
    const updatedItem = { quantity: item.quantity - 1, ...item };
    const response = await request
      .put(`/current-items/update/${item._id}`)
      .send(updatedItem)
      .expect(200);
    expect(response.body).toBe(`${item.name} updated.`);
    done();
  });

  test('delete item by id', async (done) => {
    expect.assertions(1);
    const { _id, name } = currentItems[0];
    const response = await request.delete(`/current-items/${_id}`).expect(200);
    expect(response.body).toBe(`${name} deleted.`);
    done();
  });
});
