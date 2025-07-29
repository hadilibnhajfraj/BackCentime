/**
 * Notification Controller
 * @description Placeholder controller.
 */
exports.notificationPing = async (req, res, next) => {
  try {
    return res.status(200).json({ message: 'Notification controller working' });
  } catch (err) {
    next(err);
  }
};
