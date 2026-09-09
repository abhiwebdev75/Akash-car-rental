/**
 * Barrel export for all Mongoose models. Importing this module also guarantees
 * every model is registered with Mongoose (important before running populate or
 * transactions that reference models by name).
 */
module.exports = {
  User: require('./User'),
  Location: require('./Location'),
  Vehicle: require('./Vehicle'),
  AddOn: require('./AddOn'),
  Booking: require('./Booking'),
  Payment: require('./Payment'),
  VehicleInspection: require('./VehicleInspection'),
  Damage: require('./Damage'),
  Maintenance: require('./Maintenance'),
  Document: require('./Document'),
  RentalAgreement: require('./RentalAgreement'),
  Coupon: require('./Coupon'),
  Review: require('./Review'),
  Notification: require('./Notification'),
  VehicleTransfer: require('./VehicleTransfer'),
  EmergencyRequest: require('./EmergencyRequest'),
  Counter: require('./Counter'),
  Settings: require('./Settings'),
};
