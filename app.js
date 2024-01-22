let blocks;
let sizeColors = {};
const container = document.querySelector(".container");

function getRandomHexColor() {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, 0)}`;
}

async function fetchData() {
  try {
    const response = await fetch("blocks.json");
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const jsonData = await response.json();
    blocks = jsonData.sizes;

    createBlocks();
    countFullness();
  } catch (error) {
    console.error("Fetch error: ", error);
  }
}

fetchData();

function createBlocks() {
  const blockData = blocks.map((el, index) => ({
    width: el.width,
    height: el.height,
    id: index,
  }));
  const packedBlocks = packBlocks(container.offsetWidth, blockData);

  packedBlocks.forEach((block) => {
    const blockElement = createBlock(block.id, block.width, block.height);
    blockElement.style.top = `${block.y}px`;
    blockElement.style.left = `${block.x}px`;

    container.appendChild(blockElement);
  });
}

function createBlock(index, width, height) {
  const block = document.createElement("div");
  block.textContent = index.toString();
  block.style.width = `${width}px`;
  block.style.height = `${height}px`;
  block.style.outline = "1px solid #000";

  // Перевірка, чи вже є колір для цього розміру блока
  if (sizeColors[`${width}-${height}`]) {
    block.style.backgroundColor = sizeColors[`${width}-${height}`];
  } else {
    const color = getRandomHexColor();
    block.style.backgroundColor = color;
    sizeColors[`${width}-${height}`] = color;
  }

  block.style.position = "absolute";
  block.style.margin = "0";
  block.style.order = index;
  return block;
}

function countFullness() {
  const allBlocksArea = blocks?.reduce((total, block) => {
    const area = block.width * block.height;
    return total + area;
  }, 0);

  const blockCoordinates = getBlockCoordinates();

  const emptyArea =
    container.offsetWidth * container.offsetHeight - allBlocksArea;

  const fullness = 1 - emptyArea / (emptyArea + allBlocksArea);

  const fullnessIndicator = document.createElement("p");
  fullnessIndicator.textContent = `Fullness: ${fullness.toFixed(1) * 100}`;
  document.body.insertBefore(fullnessIndicator, container);

  const result = {
    fullness: fullness,
    blockCoordinates: blockCoordinates,
  };

  console.log(result);
  return result;
}

function getBlockCoordinates() {
  return Array.from(container.children).map((block, index) => {
    const rect = block.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      initialOrder: index,
    };
  });
}

function packBlocks(containerWidth, blocks) {
  const sortedBlocks = blocks.slice().sort((a, b) => b.height - a.height);

  const rows = [];
  sortedBlocks.forEach((block) => {
    let rowFound = false;
    for (const row of rows) {
      // Перевірка, чи блок може вписатися в ряд без повороту
      if (block.width <= containerWidth - row.width) {
        row.blocks.push(block);
        row.width += block.width;
        rowFound = true;
        break;
      }
      // Перевірка, чи блок може вписатися в ряд з поворотом
      else if (
        block.height <= containerWidth - row.width &&
        block.width <= containerWidth - row.width + block.height
      ) {
        block = { ...block, width: block.height, height: block.width };
        row.blocks.push(block);
        row.width += block.width;
        rowFound = true;
        break;
      }
    }

    if (!rowFound) {
      // Якщо не вдалося вписати блок, додаємо новий ряд
      rows.push({ width: block.width, blocks: [block] });
    }
  });

  const packedBlocks = [];
  let y = 0;
  rows.forEach((row) => {
    let x = 0;
    row.blocks.forEach((block) => {
      packedBlocks.push({ ...block, x, y });
      x += block.width;
    });
    y += Math.max(...row.blocks.map((b) => b.height));
  });

  return packedBlocks;
}
