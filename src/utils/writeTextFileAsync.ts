import * as fs from 'fs/promises';

export async function writeTextFileAsync(filePath: string, content: string): Promise<void> {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`ファイル ${filePath} に書き込みました。`);
  } catch (error) {
    console.error(`ファイル書き込みエラー: ${error}`);
  }
}
