export function sendMsg(msg) {
  setTimeout(() => {
    window.postMessage(msg);
  }, 5000);
}
