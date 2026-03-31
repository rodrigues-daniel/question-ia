package br.com.cebraspe.simulados.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;

/**
 * Deserializa o campo "pegadinha" do payload v4.0.
 *
 * O campo pode chegar como:
 * - String : texto descritivo da pegadinha → retorna o texto
 * - true : havia pegadinha (sem descrição) → retorna "true"
 * - false : sem pegadinha → retorna null
 * - null : ausente → retorna null
 */
public class PegadinhaDeserializer extends StdDeserializer<String> {

    public PegadinhaDeserializer() {
        super(String.class);
    }

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctx) throws IOException {

        // String descritiva → usa diretamente
        if (p.currentToken() == JsonToken.VALUE_STRING) {
            String texto = p.getText().trim();
            return texto.isEmpty() ? null : texto;
        }

        // Boolean true → sinaliza presença de pegadinha sem descrição
        if (p.currentToken() == JsonToken.VALUE_TRUE)
            return "true";

        // Boolean false ou null → sem pegadinha
        if (p.currentToken() == JsonToken.VALUE_FALSE)
            return null;
        if (p.currentToken() == JsonToken.VALUE_NULL)
            return null;

        // Qualquer outro tipo → ignora graciosamente
        p.skipChildren();
        return null;
    }

    @Override
    public String getNullValue(DeserializationContext ctx) {
        return null;
    }
}