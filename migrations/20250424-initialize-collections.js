module.exports = {
    async up(db, client) {
      await db.createCollection('users');
      await db.createCollection('courses');
      await db.createCollection('orders');
      await db.createCollection('students');
      await db.createCollection('courseprogresses');
      await db.createCollection('identitycounters');
      await db.createCollection('lectureprogres');
      await db.createCollection('lectureprogresses');
      await db.createCollection('lectures');
      
      
      console.log('Collections created successfully!');
    },
  
    async down(db, client) {
      await db.collection('users').drop();
      await db.collection('courses').drop();
      await db.collection('orders').drop();
      await db.collection('students').drop();
      await db.collection('courseprogresses').drop();
      await db.createCollection('identitycounters').drop();
      await db.createCollection('lectureprogres').drop();
      await db.createCollection('lectureprogresses').drop();
      await db.createCollection('lectures').drop();
      
      console.log('Collections dropped successfully!');
    }
  };