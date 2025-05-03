let icons = [
    'icons/1.png', 
    'icons/2.png', 
    'icons/3.png', 
    'icons/4.png', 
    'icons/5.png', 
    'icons/6.png', 
    'icons/7.png', 
    'icons/A.png', 
    'icons/B.png', 
    'icons/C.png', 
    'icons/D.png', 
    'icons/E.png', 
];

let links = [
    'http://slither.io/', 
    'https://neal.fun/', 
    'https://zorzini.itch.io/melt-the-summit', 
];

icons.forEach((icon, index) => {
    const imgElement = document.getElementById(`icon${index + 1}`);
    if (imgElement) { // Only set if the element exists
      imgElement.src = icon;
    }
  });

links.forEach((link, index) => {
    const linkElement = document.getElementById(`link${index + 1}`);
    if (linkElement) { // Only set if the element exists
      linkElement.href = link;
      linkElement.textContent = link;
    }
  });
