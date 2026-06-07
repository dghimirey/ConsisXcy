import { fetchCategories, createCategory } from './src/services/api';

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/sections');
    const sections = await res.json();
    console.log("Sections:", sections);
    if(sections.length > 0) {
        const createRes = await fetch('http://localhost:3000/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'TestCat', sectionId: sections[0].id, schedule: [0, 1] })
        });
        const text = await createRes.text();
        console.log("Create Category Response:", createRes.status, text);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
