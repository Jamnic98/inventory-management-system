import mongoose from 'mongoose';

const roomLocationSchema = mongoose.Schema({
  id: String,
  label: String,
  layer: Number,
  isOpen: Boolean,
  editing: Boolean,
  isSelected: Boolean,
  parent: String,
  children: Array,
});

const RoomLocation = mongoose.model(
  'RoomLocation',
  roomLocationSchema,
  'locationTree'
);

export default RoomLocation;
