function Message({ text, name }) {
  return (
    <div>
      <p>{text}</p>
      <p>— {name}</p>
    </div>
  );
}

export default Message;