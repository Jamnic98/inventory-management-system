import { CurrentItem } from '../models/item.model.js';

const getItems = async (_req, res) => {
  try {
    res.json(await CurrentItem.find());
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

const getItemByID = async (req, res) => {
  try {
    res.json(await CurrentItem.findById(req.params.id));
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

const addItem = async (req, res) => {
  try {
    res.json(await CurrentItem.create(req.body));
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

const updateItemByID = async (req, res) => {
  try {
    const {
      name,
      quantity,
      room,
      location,
      expirationDate,
      lowStockAlert,
    } = req.body;
    const updatedItem = await CurrentItem.findByIdAndUpdate(req.params.id, {
      name,
      quantity: Number(quantity),
      room,
      location,
      expirationDate: Date.parse(expirationDate),
      lowStockAlert: lowStockAlert === 'true',
    });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

const deleteItemByID = async (req, res) => {
  try {
    res.json(await CurrentItem.findByIdAndDelete(req.params.id));
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

export { getItems, getItemByID, addItem, updateItemByID, deleteItemByID };
