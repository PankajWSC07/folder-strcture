const { pool } = require("../config/db");

const createTables = async () => {
  try {
    const connection = await pool.getConnection();

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        resetPasswordToken VARCHAR(255),
        resetPasswordExpire DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Todos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        todo VARCHAR(255) NOT NULL,
        description TEXT,
        date DATETIME NOT NULL,
        userId INT NOT NULL,
        status ENUM('pending', 'completed') DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Expenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        amount DECIMAL(10, 2) NOT NULL,
        date DATETIME NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        userId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        type ENUM('folder', 'file') NOT NULL,
        userId INT NOT NULL,
        parentId INT,
        rootFolderId INT DEFAULT 0,
        extension VARCHAR(50),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES Items(id) ON DELETE CASCADE,
        INDEX idx_userId_parentId (userId, parentId),
        INDEX idx_userId_type (userId, type),
        INDEX idx_rootFolderId (rootFolderId)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        filePath VARCHAR(500) NOT NULL,
        originalName VARCHAR(255) NOT NULL,
        size INT NOT NULL,
        mimeType VARCHAR(100),
        userId INT NOT NULL,
        parentId INT,
        rootFolderId INT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES Items(id) ON DELETE CASCADE,
        INDEX idx_userId_parentId (userId, parentId),
        INDEX idx_userId (userId),
        INDEX idx_parentId (parentId),
        INDEX idx_rootFolderId (rootFolderId)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        userId INT NOT NULL,
        itemId INT NOT NULL,
        fileId INT,
        can_view BOOLEAN DEFAULT FALSE,
        can_create BOOLEAN DEFAULT FALSE,
        can_upload BOOLEAN DEFAULT FALSE,
        can_edit BOOLEAN DEFAULT FALSE,
        can_delete BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY permissions_index_0 (userId, itemId),
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (itemId) REFERENCES Items(id) ON DELETE CASCADE,
        FOREIGN KEY (fileId) REFERENCES Files(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_itemId (itemId),
        INDEX idx_fileId (fileId)
      )
    `);

    connection.release();
    console.log("All tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
    process.exit(1);
  }
};

module.exports = { createTables };
