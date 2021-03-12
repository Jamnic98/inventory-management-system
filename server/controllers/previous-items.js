import { PreviousItem } from '../models/item.model.js';

const getItems = async (_req, res) => {
  try {
    const allItems = await PreviousItem.find();
    res.json(allItems);
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

const addItem = async (req, res) => {
  try {
    const item = await PreviousItem.create(req.body);
    res.json(`${item.name} added.`);
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

const deleteItemByID = async (req, res) => {
  try {
    const item = await PreviousItem.findByIdAndDelete(req.params.id);
    res.json(`${item.name} deleted.`);
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

export { getItems, addItem, deleteItemByID };
