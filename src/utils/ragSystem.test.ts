
import fs from 'fs';
import {
  VectorStoreIndex,
  storageContextFromDefaults,
  Settings,
} from 'llamaindex';
import { DataLoaderService, NewsArticle } from '../services/dataLoader';
import { Gemini } from '@llamaindex/google';
import { HuggingFaceEmbedding } from '@llamaindex/huggingface';
import { RAGSystem } from './ragSystem';

jest.mock('fs');
jest.mock('llamaindex', () => ({
  ...jest.requireActual('llamaindex'),
  VectorStoreIndex: {
    init: jest.fn(),
    fromDocuments: jest.fn(),
  },
  storageContextFromDefaults: jest.fn(),
}));
jest.mock('../services/dataLoader');
jest.mock('@llamaindex/google');
jest.mock('@llamaindex/huggingface');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedVectorStoreIndex = VectorStoreIndex as jest.Mocked<typeof VectorStoreIndex>;
const mockedStorageContextFromDefaults = storageContextFromDefaults as jest.Mock;
const mockedDataLoaderService = DataLoaderService as jest.MockedClass<typeof DataLoaderService>;
const mockedGemini = Gemini as jest.MockedClass<typeof Gemini>;
const mockedHuggingFaceEmbedding = HuggingFaceEmbedding as jest.MockedClass<typeof HuggingFaceEmbedding>;

describe('RAGSystem initialize method', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset singleton instance
    (RAGSystem as any).instance = undefined;
    
    // Clear all mocks
    jest.clearAllMocks();

    // Mock console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); // 元コードからのconsole.logの出力を抑制する（詳細：mockImplementation で上書きされる）
  });

  afterEach(() => {
    consoleLogSpy.mockRestore(); // スパイをリセット（元のconsole.logに戻す）
  });

  test('should create a new index if vector DB does not exist', async () => {
    mockedFs.existsSync.mockReturnValue(false); // existsSync：ファイルやディレクトリの存在を確認するメソッド、existsSync.mockReturnValue(false)で、常にfalse（存在しない）を返すようオーバーライド
    const mockArticles: NewsArticle[] = [
      { title: 'Test Article 1', content: 'Content 1', link: 'link1', source: 'test', pubDate: new Date() },
    ];
    const mockLoadMultipleRSS = jest.fn().mockResolvedValue(mockArticles);
    mockedDataLoaderService.prototype.loadMultipleRSS = mockLoadMultipleRSS;
    const mockIndex = { insertNodes: jest.fn() } as unknown as VectorStoreIndex;
    mockedVectorStoreIndex.fromDocuments.mockResolvedValue(mockIndex);
    mockedStorageContextFromDefaults.mockResolvedValue({} as any);
    mockedVectorStoreIndex.init.mockRejectedValue(new Error('trigger fallback'));

    // Act
    const ragSystem = await RAGSystem.getInstance();

    // Assert
    expect(mockedFs.existsSync).toHaveBeenCalledWith('./data/vectordb');
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith('./data/vectordb', { recursive: true });
    expect(mockLoadMultipleRSS).toHaveBeenCalled();
    expect(mockedVectorStoreIndex.fromDocuments).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('No existing RAG system found, creating new one.');
    expect(ragSystem.index).toBe(mockIndex);
  });

  test('should load an existing index if vector DB exists', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    const mockIndex = { asQueryEngine: jest.fn() } as unknown as VectorStoreIndex;
    mockedVectorStoreIndex.init.mockResolvedValue(mockIndex);
    mockedStorageContextFromDefaults.mockResolvedValue({} as any);

    // Act
    const ragSystem = await RAGSystem.getInstance();

    // Assert
    expect(mockedFs.existsSync).toHaveBeenCalledWith('./data/vectordb');
    expect(fs.mkdirSync).not.toHaveBeenCalled();
    expect(mockedVectorStoreIndex.init).toHaveBeenCalled();
    expect(mockedDataLoaderService.prototype.loadMultipleRSS).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Loaded existing RAG system from disk.');
    expect(ragSystem.index).toBe(mockIndex);
  });

  test('should set up LLM and embed model correctly', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedVectorStoreIndex.init.mockResolvedValue({} as any);

    // Act
    await RAGSystem.getInstance();

    // Assert
    expect(Settings.llm).toBeInstanceOf(mockedGemini);
    expect(Settings.embedModel).toBeInstanceOf(mockedHuggingFaceEmbedding);
  });

  test('should only initialize once (singleton behavior)', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedVectorStoreIndex.init.mockResolvedValue({} as any);

    // Act
    await RAGSystem.getInstance();
    await RAGSystem.getInstance();

    // Assert
    expect(mockedVectorStoreIndex.init).toHaveBeenCalledTimes(1);
  });

  test('should handle error during index loading and fall back to creating a new one', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedVectorStoreIndex.init.mockRejectedValue(new Error('Failed to load index'));
    const mockArticles: NewsArticle[] = [
      { title: 'Test Article 2', content: 'Content 2', link: 'link2', source: 'test2', pubDate: new Date() },
    ];
    const mockLoadMultipleRSS = jest.fn().mockResolvedValue(mockArticles);
    mockedDataLoaderService.prototype.loadMultipleRSS = mockLoadMultipleRSS;
    const mockIndex = { insertNodes: jest.fn() } as unknown as VectorStoreIndex;
    mockedVectorStoreIndex.fromDocuments.mockResolvedValue(mockIndex);

    // Act
    const ragSystem = await RAGSystem.getInstance();

    // Assert
    expect(mockedVectorStoreIndex.init).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('No existing RAG system found, creating new one.');
    expect(mockLoadMultipleRSS).toHaveBeenCalled();
    expect(mockedVectorStoreIndex.fromDocuments).toHaveBeenCalled();
    expect(ragSystem.index).toBe(mockIndex);
  });
});
