const Datastore = require('nedb-core');

class DBWrapper {
  constructor(filePath) {
    this.db = new Datastore({ filename: filePath, autoload: true });
    this.TABLE_NAME={
      SUBSCRIPTIONS: "subscriptions",
      IPO: "ipo",
    }
  }

  // Create (Insert)
  async create(tableName, data) {
    return new Promise((resolve, reject) => {
      this.db.insert({ table: tableName, ...data }, (err, newDoc) => {
        if (err) {
          return reject(err);
        }
        resolve(newDoc);
      });
    });
  }

  // Read (Get All)
  async getAll(tableName) {
    return new Promise((resolve, reject) => {
      this.db.find({ table: tableName }, (err, docs) => {
        if (err) {
          return reject(err);
        }
        resolve(docs);
      });
    });
  }

  // get by id
  async getById(tableName, id) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ table: tableName, _id: id }, (err, doc) => {
        if (err) {
          return reject(err);
        }
        resolve(doc);
      });
    });
  }

  // Update
  async update(tableName, id, updatedData) {
    return new Promise((resolve, reject) => {
      this.db.update({ table: tableName, _id: id }, { $set: updatedData }, {}, (err, numUpdated) => {
        if (err) {
          return reject(err);
        }
        resolve(numUpdated);
      });
    });
  }

  // Delete
  async delete(tableName, id) {
    return new Promise((resolve, reject) => {
      this.db.remove({ table: tableName, _id: id }, {}, (err, numRemoved) => {
        if (err) {
          return reject(err);
        }
        resolve(numRemoved);
      });
    });
  }

  async deleteAll(tableName) {
    return new Promise((resolve, reject) => {
      this.db.remove({ table: tableName }, { multi: true }, (err, numRemoved) => {
        if (err) {
          return reject(err);
        }
        resolve(numRemoved);
      });
    });
  }

  // Find by conditions
  async find(tableName, conditions) {
    return new Promise((resolve, reject) => {
      this.db.find({ table: tableName, ...conditions }, (err, docs) => {
        if (err) {
          return reject(err);
        }
        resolve(docs);
      });
    });
  }

  // Filter using a predicate function
  async filter(tableName, predicate) {
    const allDocs = await this.getAll(tableName);
    return allDocs.filter(predicate);
  }

  // Sort by a key
  async sort(tableName, key, order = 'asc') {
    const allDocs = await this.getAll(tableName);
    return allDocs.sort((a, b) => {
      if (order === 'asc') {
        return a[key] > b[key] ? 1 : -1;
      } else {
        return a[key] < b[key] ? 1 : -1;
      }
    });
  }

  // Count items
  async count(tableName) {
    const allDocs = await this.getAll(tableName);
    return allDocs.length;
  }


  async deleteByKey(tableName, key, value) {
    return new Promise((resolve, reject) => {
      this.db.remove({ table: tableName, [key]: value }, { multi: true }, (err, numRemoved) => {
        if (err) {
          return reject(err);
        }
        resolve(numRemoved);
      });
    });
  }
}

const db = new DBWrapper("database.db");

module.exports = db;