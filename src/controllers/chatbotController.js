/**
 * Chatbot Controller
 * @description Placeholder controller.
 */
exports.chatbotPing = async (req, res, next) => {
  try {
    return res.status(200).json({ message: 'Chatbot controller working' });
  } catch (err) {
    next(err);
  }
};
