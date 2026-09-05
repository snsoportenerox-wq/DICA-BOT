const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    PermissionsBitField
} = require("discord.js");

const CONFIG = {
    VERIFICATION_CHANNEL: "1540720296926122025",
    VERIFIED_ROLE: "1538146639703703562"
};

const verificationCodes = new Map();

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationPanel(client) {
    try {
        const channel = await client.channels.fetch(
            CONFIG.VERIFICATION_CHANNEL
        );

        if (!channel) {
            console.error("❌ No se encontró el canal de verificación.");
            return;
        }

        // Buscar panel existente sin usar message.author.user
        const messages = await channel.messages.fetch({ limit: 50 });

        const existingPanel = messages.find(message =>
            message.author?.id === client.user.id &&
            message.embeds?.some(embed =>
                embed.title === "🔐 VERIFICACIÓN"
            ) &&
            message.components?.some(row =>
                row.components?.some(component =>
                    component.customId === "dica_verify_button"
                )
            )
        );

        if (existingPanel) {
            console.log("🔐 Panel de verificación ya existe.");
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("🔐 VERIFICACIÓN")
            .setDescription(
                "Para acceder al servidor debes verificar tu cuenta.\n\n" +
                "📋 **Sigue estos pasos**\n\n" +
                "1️⃣ Haz clic en **Verificar**.\n" +
                "2️⃣ Revisa el MD que te enviará DICA Guard.\n" +
                "3️⃣ Introduce correctamente el código recibido.\n" +
                "4️⃣ Si el código es correcto, recibirás automáticamente tu rol de verificado.\n\n" +
                "⚠️ El código es personal y tiene una duración limitada."
            )
            .setFooter({
                text: "DICA Guard • DICA STUDIO"
            })
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId("dica_verify_button")
            .setLabel("Verificar")
            .setEmoji("✅")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder()
            .addComponents(button);

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        console.log("✅ Panel de verificación enviado correctamente.");

    } catch (error) {
        console.error("❌ Error en panel de verificación:", error);
    }
}


async function startVerification(interaction) {
    try {
        const member = interaction.member;

        if (!member) {
            return interaction.reply({
                content: "❌ No se pudo encontrar tu información en el servidor.",
                ephemeral: true
            });
        }

        if (member.roles.cache.has(CONFIG.VERIFIED_ROLE)) {
            return interaction.reply({
                content: "✅ Ya estás verificado.",
                ephemeral: true
            });
        }

        const code = generateCode();

        verificationCodes.set(interaction.user.id, {
            code,
            attempts: 0,
            expires: Date.now() + 5 * 60 * 1000
        });

        try {
            await interaction.user.send(
                "🔐 **VERIFICACIÓN DICA STUDIO**\n\n" +
                `Tu código de verificación es:\n\n` +
                `**${code}**\n\n` +
                "⏱️ Este código expira en **5 minutos**.\n" +
                "🚫 No compartas este código con nadie."
            );
        } catch {
            verificationCodes.delete(interaction.user.id);

            return interaction.reply({
                content:
                    "❌ No pude enviarte el código por MD.\n\n" +
                    "Activa los mensajes directos de miembros del servidor e inténtalo nuevamente.",
                ephemeral: true
            });
        }

        return showVerificationModal(interaction);

    } catch (error) {
        console.error("❌ Error iniciando verificación:", error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ Ocurrió un error durante la verificación.",
                ephemeral: true
            }).catch(() => {});
        }
    }
}


async function showVerificationModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("dica_verify_modal")
        .setTitle("🔐 Verificación");

    const input = new TextInputBuilder()
        .setCustomId("verification_code")
        .setLabel("Introduce el código recibido por MD")
        .setPlaceholder("Ejemplo: 123456")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(6)
        .setMaxLength(6);

    const row = new ActionRowBuilder()
        .addComponents(input);

    modal.addComponents(row);

    await interaction.showModal(modal);
}


async function verifyCode(interaction) {
    try {
        const saved = verificationCodes.get(interaction.user.id);

        if (!saved) {
            return interaction.reply({
                content:
                    "❌ No tienes un código activo.\n" +
                    "Pulsa nuevamente el botón **Verificar**.",
                ephemeral: true
            });
        }

        if (Date.now() > saved.expires) {
            verificationCodes.delete(interaction.user.id);

            return interaction.reply({
                content:
                    "⏱️ Tu código ha expirado.\n" +
                    "Solicita uno nuevo.",
                ephemeral: true
            });
        }

        if (saved.attempts >= 3) {
            verificationCodes.delete(interaction.user.id);

            return interaction.reply({
                content:
                    "🚫 Has superado el número máximo de intentos.\n" +
                    "Solicita un nuevo código.",
                ephemeral: true
            });
        }

        const enteredCode = interaction.fields
            .getTextInputValue("verification_code")
            .trim();

        if (enteredCode !== saved.code) {
            saved.attempts++;

            verificationCodes.set(interaction.user.id, saved);

            const remaining = 3 - saved.attempts;

            return interaction.reply({
                content:
                    `❌ Código incorrecto.\n\n` +
                    `Intentos restantes: **${remaining}**`,
                ephemeral: true
            });
        }

        const member = interaction.member;

        if (!member) {
            return interaction.reply({
                content: "❌ No se pudo encontrar tu miembro del servidor.",
                ephemeral: true
            });
        }

        const role = await interaction.guild.roles.fetch(
            CONFIG.VERIFIED_ROLE
        );

        if (!role) {
            return interaction.reply({
                content:
                    "❌ No se encontró el rol de verificado.",
                ephemeral: true
            });
        }

        await member.roles.add(
            role,
            "Verificación DICA Guard"
        );

        verificationCodes.delete(interaction.user.id);

        return interaction.reply({
            content:
                "✅ **¡Verificación completada!**\n\n" +
                `Has recibido el rol ${role}.`,
            ephemeral: true
        });

    } catch (error) {
        console.error("❌ Error verificando código:", error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content:
                    "❌ Ocurrió un error al completar la verificación.",
                ephemeral: true
            }).catch(() => {});
        }
    }
}


module.exports = {
    CONFIG,
    verificationCodes,
    sendVerificationPanel,
    startVerification,
    showVerificationModal,
    verifyCode
};
