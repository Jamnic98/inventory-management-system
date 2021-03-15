import { PreviousItem } from '../models/item.model.js';

const getItems = async (_req, res) => {
  try {
    res.json(await PreviousItem.find());
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

const addItem = async (req, res) => {
  try {
    res.json(await PreviousItem.create(req.body));
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

const deleteItemByID = async (req, res) => {
  try {
    res.json(await PreviousItem.findByIdAndDelete(req.params.id));
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

export { getItems, addItem, deleteItemByID };
