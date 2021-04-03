import Email from '../models/email.model.js';

const getEmails = async (_req, res) => {
  try {
    res.json(await Email.find());
  } catch (err) {
    res.status(400);
    console.error(err);
  }
};

const addEmail = async (req, res) => {
  try {
    res.json(await Email.create(req.body));
  } catch (err) {
    res.status(400);
    console.error(err);
  }
};

const deleteEmailById = async (req, res) => {
  try {
    res.json(await Email.findByIdAndDelete(req.params.id));
  } catch (err) {
    res.status(400);
    console.error(err);
  }
};

export { getEmails, addEmail, deleteEmailById };
