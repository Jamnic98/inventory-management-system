import RoomLocation from '../models/room-location.model.js';

const getLocations = async (_req, res) => {
  try {
    res.json(await RoomLocation.find());
  } catch (err) {
    res.status(400);
    console.error(err);
  }
};

const addLocation = async (req, res) => {
  try {
    res.json(await RoomLocation.create(req.body));
  } catch (err) {
    res.status(400);
    console.error(err);
  }
};

const deleteLocationById = async (req, res) => {
  try {
    await RoomLocation.findByIdAndDelete(req.params.id);
    res.json();
  } catch (err) {
    res.status(400);
    console.error(err);
  }
};

export { getLocations, addLocation, deleteLocationById };
