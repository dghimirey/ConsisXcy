import fetch from 'node-fetch';

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Category', sectionId: 'f97dc308-4dda-4f9e-b9cf-7df24a4353d1' })
    });
    const text = await res.text();
    console.log(res.status, text);
  } catch(e) {
      console.error(e);
  }
}

run();
