import { config } from 'dotenv';
import axios from 'axios';
config();

// 普通
const RAGSystemQuery = async (query: string): Promise<void> => {
    try {
        const res = await fetch(`http://localhost:${process.env.PORT}/api/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        });
        if (!res.ok) throw new Error(`${res.status}`);

        const data = await res.json();
        console.log("回答:", data);
    } catch (error) {
        console.error(error);
    }
};

// axiosで
const RAGSystemQueryWithAxios = async (query: string): Promise<void> => {
    try {
        const response = await axios.post(`http://localhost:${process.env.PORT}/api/query`, {
            query: query // JSオブジェクトをそのまま渡せる
        });
        console.log("回答:", response.data); // 自動でJSONをパースしてくれる
    } catch (error) {
        // ネットワークエラーもHTTPエラーもここで捕捉できる
          if (axios.isAxiosError(error)) {
              console.error("API Error:", error.response?.data || error.message);
          } else {
              console.error("Unexpected Error:", error);
          }
    }
};

// テスト実行
RAGSystemQuery("AIの未来について教えてください。");
RAGSystemQueryWithAxios("AIの未来について教えてください。");