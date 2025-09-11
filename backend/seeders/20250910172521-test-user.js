"use strict";

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert("users", [{
      social_id: "test123",             
      social_provider: "swagger",       
      name: "홍길동",                   
      email: "hong@test.com",          
      gender: "private",                
      goal: "hobby",                    
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", { social_id: "test123" }, {});
  }
};
