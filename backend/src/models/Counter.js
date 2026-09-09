/**
 * Atomic sequence generator. Used to produce gap-tolerant, monotonically
 * increasing numbers for booking numbers (CR-YYYY-######) and agreement numbers.
 * `findOneAndUpdate({ $inc }, { upsert:true, new:true })` is atomic in MongoDB,
 * so concurrent requests never receive the same sequence value.
 */
const { Schema, model } = require('mongoose');

const counterSchema = new Schema(
  {
    _id: { type: String, required: true }, // e.g. "booking-2026"
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

/**
 * Increment and return the next value for a given key. Accepts an optional
 * Mongoose session so it can participate in the booking transaction.
 */
counterSchema.statics.next = async function next(key, session = null) {
  const doc = await this.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  );
  return doc.seq;
};

module.exports = model('Counter', counterSchema);
