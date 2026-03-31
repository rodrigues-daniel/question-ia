package br.com.cebraspe.simulados.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(OllamaChatModel ollamaChatModel) {
        return ChatClient.builder(ollamaChatModel)
                .defaultSystem("""
                        Você é um especialista em concursos públicos brasileiros,
                        especialmente no estilo CEBRASPE/CESPE (Certo ou Errado).
                        Suas respostas devem ser precisas, técnicas e focadas no
                        conteúdo cobrado em concursos. Sempre que gerar questões,
                        siga rigorosamente o estilo assertivo do CEBRASPE, incluindo
                        pegadinhas sutis baseadas em detalhes legais ou conceituais.
                        Responda sempre em português brasileiro.
                        """)
                .build();
    }
}