document.getElementById("userInput").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// Pane dragging and resizing logic
document.addEventListener('DOMContentLoaded', function() {
  const panes = document.querySelectorAll('.pane');
  let i = 1;

  panes.forEach(pane => {
    const title = pane.querySelector('.title');
    const corner = pane.querySelector('.corner');

    pane.addEventListener("mousedown", () => {
      i = i + 1;
      pane.style.zIndex = i;
    });

    title.addEventListener("mousedown", (event) => {
      // Ignore if clicked on settings button
      if (event.target.id === 'settingsBtn') {
        return;
      }

      pane.classList.add("is-dragging");
      let l = pane.offsetLeft;
      let t = pane.offsetTop;
      let startX = event.pageX;
      let startY = event.pageY;

      const drag = (event) => {
        event.preventDefault();
        pane.style.left = l + (event.pageX - startX) + 'px';
        pane.style.top = t + (event.pageY - startY) + 'px';
      };

      const mouseup = () => {
        pane.classList.remove("is-dragging");
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', mouseup);
      };

      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', mouseup);
    });

    corner.addEventListener("mousedown", (event) => {
      event.stopPropagation();
      let w = pane.clientWidth;
      let h = pane.clientHeight;
      let startX = event.pageX;
      let startY = event.pageY;

      const drag = (event) => {
        event.preventDefault();
        const newWidth = Math.max(300, w + (event.pageX - startX));
        const newHeight = Math.max(200, h + (event.pageY - startY));
        pane.style.width = newWidth + 'px';
        pane.style.height = newHeight + 'px';
      };

      const mouseup = () => {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', mouseup);
      };

      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', mouseup);
    });
  });
});