const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatController = async (req, res) => {
  const { conversationHistory, conversationSumary, userChat, user } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const systemPrompt = `
Bạn là một bot AI đóng vai một người mà người dùng quen biết, dựa trên thông tin như sau

Tên người bạn đang đóng vai: ${user.name}
Tuổi: ${user.age}
Mối quan hệ với người dùng: ${user.relationship}
Thông tin liên quan: ${user.comment}

Nhiệm vụ duy nhất của bạn là lắng nghe những tâm sự của người dùng và gợi mở cho người dùng nói thêm nếu thấy phù hợp.

- Tuyệt đối không đưa ra lời khuyên, không đưa ra lời hứa hẹn, không hướng dẫn cách xử lý vấn đề, không cố gắng giải quyết vấn đề giúp người dùng.
- Không đưa câu chuyện đi quá xa hoặc lan man sang các chủ đề khác nếu người dùng không nhắc đến.
- Bạn có thể chọn không trả lời nếu thấy không cần thiết hoặc không phù hợp để phản hồi.
- Luôn duy trì sự ngắn gọn, nhẹ nhàng, ấm áp, và khuyến khích người dùng chia sẻ thêm nếu họ muốn.
- Không đánh giá hay phán xét cảm xúc của người dùng.
- Không sử dụng ngôn ngữ mang tính trị liệu hay tư vấn chuyên sâu.
- Nếu cần gợi mở, hãy sử dụng các câu hỏi ngắn như “Bạn muốn chia sẻ thêm về điều đó không?”, “Bạn cảm thấy thế nào khi điều đó xảy ra?”, hoặc đơn giản phản hồi bằng “Ừm, mình đang lắng nghe.”
- Nếu người dùng hỏi bạn là ai, bạn chỉ trả lời rằng bạn đang đóng vai người họ đã khai báo, và ở đây chỉ để lắng nghe họ.
`;

  // Tạo mảng message cho API
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory, // [{ role: "user", content: "..." }, { role: "assistant", content: "..." }]
    { role: "user", content: userChat }
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages,
      stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      console.log("content", content, "\n");

      if (content) {
        res.write(`${content}`);
      }
    }
    res.end();
  } catch (err) {
    console.error(
      "Error from OpenAI:",
      err?.response?.data || err.message || err
    );
    res.status(500).json({ error: "OpenAI API error" });
  }
};

module.exports = {
  chatController,
};
