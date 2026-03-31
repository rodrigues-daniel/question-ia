package br.com.cebraspe.simulados.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;

/**
 * Deserializa o campo "gabarito" do payload v4.0.
 *
 * Aceita:
 * - JSON boolean : true / false
 * - String : "C", "CERTO", "TRUE" → true
 * "E", "ERRADO", "FALSE" → false
 */
public class GabaritoDeserializer extends StdDeserializer<Boolean> {

    public GabaritoDeserializer() {
        super(Boolean.class);
    }

    @Override
    public Boolean deserialize(JsonParser p, DeserializationContext ctx) throws IOException {

        // Caso 1: já é boolean nativo no JSON (true / false)
        if (p.currentToken() == JsonToken.VALUE_TRUE)
            return Boolean.TRUE;
        if (p.currentToken() == JsonToken.VALUE_FALSE)
            return Boolean.FALSE;

        // Caso 2: vem como string "C", "E", "CERTO", "ERRADO", "TRUE", "FALSE"
        if (p.currentToken() == JsonToken.VALUE_STRING) {
            String valor = p.getText().trim().toUpperCase();
            return switch (valor) {
                case "C", "CERTO", "TRUE" -> Boolean.TRUE;
                case "E", "ERRADO", "FALSE" -> Boolean.FALSE;
                default -> throw ctx.weirdStringException(
                        valor, Boolean.class,
                        "Gabarito inválido. Use: true/false, \"C\"/\"E\", \"CERTO\"/\"ERRADO\"");
            };
        }

        throw ctx.wrongTokenException(p, Boolean.class,
                JsonToken.VALUE_STRING, "Esperado boolean ou string para gabarito");
    }
}