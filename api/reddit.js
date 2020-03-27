const subData = await fetch(
  'https://cors-anywhere.herokuapp.com/https://www.reddit.com/r/random/about.json'
);
const subDataJson = await subData.json();
