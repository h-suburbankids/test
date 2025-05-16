document.getElementById("userInput").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// Position and Resize
document.addEventListener('DOMContentLoaded', function() {
  const panes = document.querySelectorAll('.pane');
  let i = 1;

  panes.forEach(pane => {
    // Initial size
    pane.style.width = '30vw';
    pane.style.height = '90vh';

    // Initial position
    pane.style.left = '68vw';
    pane.style.top = '3vh';
  });
  
  function pxToVw(px) {
    return (px / window.innerWidth) * 100;
  }

  function pxToVh(px) {
    return (px / window.innerHeight) * 100;
  }

  //Abandoned
  function vwToPx(vw) {
    return (vw / 100) * window.innerWidth;
  }

  function vhToPx(vh) {
    return (vh / 100) * window.innerHeight;
  }

  panes.forEach(pane => {
    const title = pane.querySelector('.title');
    const corner = pane.querySelector('.corner');

    // Note: Using vw/vh for flexible positioning and sizing for a variety of screen sizes and resolutions
    pane.style.left = pxToVw(pane.offsetLeft) + 'vw';
    pane.style.top = pxToVh(pane.offsetTop) + 'vh';
    pane.style.width = pxToVw(pane.offsetWidth) + 'vw';
    pane.style.height = pxToVh(pane.offsetHeight) + 'vh';

    pane.addEventListener("mousedown", () => {
      i += 1;
      if(pane.style.top < 0){
        pane.style.top = 0;
      }
      pane.style.zIndex = i;
    });

    title.addEventListener("mousedown", (event) => {
      if (event.target.id === 'settingsBtn') return;

      pane.classList.add("is-dragging");

      const startX = event.pageX;
      const startY = event.pageY;

      const initialLeft = pane.getBoundingClientRect().left;
      const initialTop = pane.getBoundingClientRect().top;

      const drag = (event) => {
        event.preventDefault();
        const dx = event.pageX - startX;
        const dy = event.pageY - startY;

        const newLeft = pxToVw(initialLeft + dx);
        const newTop = pxToVh(initialTop + dy);


        pane.style.left = newLeft + 'vw';
        pane.style.top = newTop + 'vh';
      };

      const mouseup = () => {
        pane.classList.remove("is-dragging");
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', mouseup);
        if (pane.style.top < 0){
          pane.style.top = 0;
        }
      };

      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', mouseup);
    });

    corner.addEventListener("mousedown", (event) => {
      event.stopPropagation();

      const startX = event.pageX;
      const startY = event.pageY;

      const initialWidth = pane.getBoundingClientRect().width;
      const initialHeight = pane.getBoundingClientRect().height;

      const drag = (event) => {
        event.preventDefault();
        const dx = event.pageX - startX;
        const dy = event.pageY - startY;

        const newWidth = Math.max(200, initialWidth + dx);
        const newHeight = Math.max(300, initialHeight + dy);

        pane.style.width = pxToVw(newWidth) + 'vw';
        pane.style.height = pxToVh(newHeight) + 'vh';
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

