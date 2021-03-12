import { CurrentItem } from '../models/item.model.js';

const getItems = async (_req, res) => {
  try {
    const allItems = await CurrentItem.find();
    res.json(allItems);
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
    const item = await CurrentItem.create(req.body);
    res.json(`${item.name} added.`);
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
      expirationDate:
        expirationDate !== null ? Date.parse(expirationDate) : null,
      lowStockAlert: lowStockAlert === 'true',
    });
    res.json(`${updatedItem.name} updated.`);
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

const deleteItemByID = async (req, res) => {
  try {
    const item = await CurrentItem.findByIdAndDelete(req.params.id);
    res.json(`${item.name} deleted.`);
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

export { getItems, getItemByID, addItem, updateItemByID, deleteItemByID };
