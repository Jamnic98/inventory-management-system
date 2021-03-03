import { PreviousItem } from '../models/item.model.js';

export const getItems = async (_req, res) => {
  try {
    const items = await PreviousItem.find();
    res.json(items);
  } catch (err) {
    res.status(400).send();
    console.error(err);
  }
};
