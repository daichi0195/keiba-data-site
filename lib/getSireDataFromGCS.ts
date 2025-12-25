import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: 'umadata',
});

export async function getSireDataFromGCS(sireName: string) {
  try {
    const bucket = storage.bucket('umadata');
    const file = bucket.file(`sires/${sireName}.json`);

    const [contents] = await file.download();
    const data = JSON.parse(contents.toString());

    return data;
  } catch (error) {
    console.error(`Error fetching sire data for ${sireName}:`, error);
    throw error;
  }
}
