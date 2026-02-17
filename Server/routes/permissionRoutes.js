const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  givePermission,
  getPermissions,
  getAllUsersForPermission,
  getItemPermissions,
  setItemPermission,
  removeItemPermission,
} = require("../controllers/permissionController");

router.use(authMiddleware);

router.post("/give", givePermission);
router.get("/", getPermissions);
router.get("/users/available/list", getAllUsersForPermission);
router.get("/item/:itemId", getItemPermissions);
router.put("/item/:itemId", setItemPermission);
router.delete("/item/:itemId/:userId", removeItemPermission);

module.exports = router;
