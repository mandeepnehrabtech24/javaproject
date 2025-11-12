import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export class FileParser {
  async parseFile(buffer, mimetype) {
    try {
      if (mimetype === 'application/pdf') {
        return await this.parsePDF(buffer);
      } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/msword'
      ) {
        return await this.parseDOCX(buffer);
      } else if (mimetype.startsWith('text/')) {
        return buffer.toString('utf-8');
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.error('File parsing error:', error);
      throw new Error('Failed to parse file: ' + error.message);
    }
  }

  async parsePDF(buffer) {
    const data = await pdf(buffer);
    return data.text;
  }

  async parseDOCX(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  async parseImage(buffer) {
    return 'Image OCR not implemented in this version. Please use text-based resumes.';
  }
}

export const fileParser = new FileParser();
