import { CurrentItem } from '../models/item.model.js';

export const getItems = async (_req, res) => {
  try {
    const items = await CurrentItem.find();
    res.json(items);
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};

export const getOneItem = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await CurrentItem.findById(id);
    res.json(item);
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};
