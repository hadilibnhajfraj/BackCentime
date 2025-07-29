/**
 * Report Controller
 * @description Placeholder controller.
 */
exports.reportPing = async (req, res, next) => {
  try {
    return res.status(200).json({ message: 'Report controller working' });
  } catch (err) {
    next(err);
  }
};
