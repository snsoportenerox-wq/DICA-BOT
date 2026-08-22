require("dotenv").config();

const express = require("express");
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

// =====================================================
// EXPRESS
// =====================================================

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).send("🟢 DICA STUDIO Ticket Bot está online.");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
    bot: client?.user?.tag || "connecting",
    uptime: process.uptime()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Express iniciado en el puerto ${PORT}`);
});

// =====================================================
// CLIENTE
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// =====================================================
// CONFIGURACIÓN
// =====================================================

const CONFIG = {

  // 📌 Canal donde el bot manda el panel
  PANEL_CHANNEL: "1514355453742551102",

  // 📋 Canal de logs
  LOG_CHANNEL: "1539791936058163241",

  // 📥 Canal donde llega la solicitud
  REQUEST_CHANNEL: "1540814503607009330",

  // 📂 CATEGORÍA DONDE SE CREAN LOS TICKETS
  TICKET_CATEGORY: "1540814776878374943",

  // 🛡️ Rol Staff
  STAFF_ROLE: "1540815218689441812",

  // 🤖 Invitación del bot
  BOT_INVITE_URL:
    "https://discord.com/oauth2/authorize?client_id=1530755091047387263"
};

// =====================================================
// CATEGORÍAS DE TICKET
// =====================================================

const categories = {

  soporte: {
    name: "Soporte",
    emoji: "🛠️",
    color: 0x5865F2,

    options: [
      ["error", "🐛", "Reportar un error", "Reporta un error o problema"],
      ["tecnico", "⚙️", "Problema técnico", "Problemas técnicos"],
      ["ayuda", "❓", "Ayuda general", "Necesitas ayuda"],
      ["config", "🔧", "Configuración", "Ayuda con configuración"],
      ["staff", "📞", "Hablar con soporte", "Hablar directamente con soporte"]
    ],

    questions: [
      ["problema", "¿Qué problema tienes?", TextInputStyle.Paragraph],
      ["detalles", "Describe el problema", TextInputStyle.Paragraph],
      ["pruebas", "¿Tienes pruebas?", TextInputStyle.Paragraph],
      ["extra", "Información adicional", TextInputStyle.Paragraph]
    ]
  },

  servicios: {
    name: "Servicios",
    emoji: "💼",
    color: 0x9B59B6,

    options: [
      ["diseno", "🎨", "Diseño", "Solicitar un diseño"],
      ["desarrollo", "💻", "Desarrollo", "Solicitar desarrollo"],
      ["logo", "🖼️", "Logo / Banner", "Solicitar logo o banner"],
      ["bot", "🤖", "Bot", "Solicitar un bot"],
      ["otro", "🌐", "Otro servicio", "Otro tipo de servicio"]
    ],

    questions: [
      ["servicio", "¿Qué servicio necesitas?", TextInputStyle.Short],
      ["descripcion", "Describe lo que necesitas", TextInputStyle.Paragraph],
      ["referencia", "¿Tienes alguna referencia?", TextInputStyle.Paragraph],
      ["presupuesto", "¿Presupuesto aproximado?", TextInputStyle.Short],
      ["extra", "¿Algún requisito adicional?", TextInputStyle.Paragraph]
    ]
  },

  compras: {
    name: "Compras",
    emoji: "💰",
    color: 0x57F287,

    options: [
      ["comprar", "🛒", "Comprar un servicio", "Realizar una compra"],
      ["pago", "💳", "Métodos de pago", "Consultar métodos de pago"],
      ["pedido", "📦", "Consultar pedido", "Consultar un pedido"],
      ["problema", "🔄", "Problema con compra", "Problema con una compra"],
      ["precios", "❓", "Información de precios", "Consultar precios"]
    ],

    questions: [
      ["producto", "¿Qué quieres comprar?", TextInputStyle.Short],
      ["cantidad", "¿Qué cantidad necesitas?", TextInputStyle.Short],
      ["metodo", "¿Método de pago?", TextInputStyle.Short],
      ["detalles", "Detalles de la compra", TextInputStyle.Paragraph]
    ]
  },

  consultas: {
    name: "Consultas",
    emoji: "📩",
    color: 0x3498DB,

    options: [
      ["general", "💬", "Consulta general", "Consulta general"],
      ["informacion", "📋", "Información", "Solicitar información"],
      ["colaboracion", "🤝", "Colaboraciones", "Proponer colaboración"],
      ["otra", "❓", "Otra consulta", "Otra consulta"]
    ],

    questions: [
      ["consulta", "¿Cuál es tu consulta?", TextInputStyle.Paragraph],
      ["detalles", "Explica tu consulta", TextInputStyle.Paragraph],
      ["extra", "Información adicional", TextInputStyle.Paragraph]
    ]
  },

  reportes: {
    name: "Reportes",
    emoji: "🚨",
    color: 0xED4245,

    options: [
      ["usuario", "👤", "Reportar usuario", "Reportar a un usuario"],
      ["bot", "🤖", "Reportar bot", "Reportar un bot"],
      ["staff", "🛡️", "Reportar staff", "Reportar a Staff"],
      ["error", "🐛", "Reportar error", "Reportar un error"],
      ["pruebas", "📎", "Enviar pruebas", "Enviar pruebas"]
    ],

    questions: [
      ["reportado", "¿A quién reportas?", TextInputStyle.Short],
      ["motivo", "Motivo del reporte", TextInputStyle.Paragraph],
      ["pruebas", "¿Qué pruebas tienes?", TextInputStyle.Paragraph],
      ["fecha", "¿Cuándo ocurrió?", TextInputStyle.Short],
      ["extra", "Información adicional", TextInputStyle.Paragraph]
    ]
  }
};

// =====================================================
// EMBED PRINCIPAL
// =====================================================

function createPanelEmbed() {

  return new EmbedBuilder()
    .setColor(0x8E44AD)
    .setTitle("🎫・𝐓𝐈𝐂𝐊𝐄𝐓𝐒 — 𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎")
    .setDescription(`«✦・𝐁𝐈𝐄𝐍𝐕𝐄𝐍𝐈𝐃𝐎 𝐀𝐋 𝐒𝐈𝐒𝐓𝐄𝐌𝐀 𝐃𝐄 𝐒𝐎𝐏𝐎𝐑𝐓𝐄・✦

╭─────────────── ✦ ───────────────╮
🎨・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎
✦・Diseño • Desarrollo • Creatividad・✦
╰─────────────── ✦ ───────────────╯

🎟️ ¿𝐍𝐄𝐂𝐄𝐒𝐈𝐓𝐀𝐒 𝐀𝐘𝐔𝐃𝐀?

Nuestro sistema de tickets está diseñado para brindarte una atención rápida, organizada y personalizada.

Selecciona la opción que mejor describa tu solicitud y nuestro equipo te atenderá.

────────────────

🛠️ 𝐒𝐎𝐏𝐎𝐑𝐓𝐄

«¿Tienes algún problema o necesitas asistencia?»

💼 𝐒𝐄𝐑𝐕𝐈𝐂𝐈𝐎𝐒

«¿Quieres información sobre nuestros servicios o realizar una solicitud?»

💰 𝐂𝐎𝐌𝐏𝐑𝐀𝐒

«¿Deseas adquirir alguno de nuestros productos o servicios?»

📩 𝐂𝐎𝐍𝐒𝐔𝐋𝐓𝐀𝐒

«Para dudas, preguntas o cualquier otra información.»

🚨 𝐑𝐄𝐏𝐎𝐑𝐓𝐄𝐒

«Informa sobre problemas, errores o situaciones que debamos revisar.»

────────────────

📋 𝐑𝐄𝐂𝐔𝐄𝐑𝐃𝐀

«✦ Explica tu solicitud con claridad.
✦ Proporciona pruebas cuando sea necesario.
✦ No abras varios tickets por el mismo asunto.
✦ Mantén el respeto hacia nuestro equipo.»

✨ 𝐓𝐔 𝐒𝐀𝐓𝐈𝐒𝐅𝐀𝐂𝐂𝐈Ó𝐍 𝐄𝐒 𝐍𝐔𝐄𝐒𝐓𝐑𝐀 𝐏𝐑𝐈𝐎𝐑𝐈𝐃𝐀𝐃.

🎨・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎
Creamos. Diseñamos. Innovamos.`);

}

// =====================================================
// MENÚ PRINCIPAL
// =====================================================

function createMainMenu() {

  return new ActionRowBuilder()
    .addComponents(

      new StringSelectMenuBuilder()
        .setCustomId("ticket_category")
        .setPlaceholder(
          "🎫・Selecciona una opción para abrir un ticket..."
        )

        .addOptions(

          Object.entries(categories).map(
            ([id, category]) =>

              new StringSelectMenuOptionBuilder()
                .setLabel(category.name)
                .setDescription(
                  `Abrir un ticket de ${category.name}`
                )
                .setEmoji(category.emoji)
                .setValue(id)

          )

        )

    );

}

// =====================================================
// BOTÓN INVITAR BOT
// =====================================================

function createInviteButton() {

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setLabel("🤖・Invitar uno de nuestros bots")
        .setStyle(ButtonStyle.Link)
        .setURL(CONFIG.BOT_INVITE_URL)

    );

}

// =====================================================
// MENÚ DENTRO DEL TICKET
// =====================================================

function createCategoryMenu(category) {

  const data = categories[category];

  return new ActionRowBuilder()
    .addComponents(

      new StringSelectMenuBuilder()
        .setCustomId(`ticket_type:${category}`)
        .setPlaceholder(
          `${data.emoji}・Selecciona una opción...`
        )

        .addOptions(

          data.options.map(
            ([value, emoji, label, description]) =>

              new StringSelectMenuOptionBuilder()
                .setLabel(label)
                .setDescription(description)
                .setEmoji(emoji)
                .setValue(value)

          )

        )

    );

}

// =====================================================
// BOTONES DEL TICKET
// =====================================================

function createTicketButtons() {

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("ticket_add")
        .setLabel("Añadir")
        .setEmoji("➕")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Cerrar")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)

    );

}

// =====================================================
// EMBED DE BIENVENIDA
// =====================================================

function createWelcomeEmbed(category) {

  const data = categories[category];

  return new EmbedBuilder()
    .setColor(data.color)
    .setTitle(
      `${data.emoji}・𝐓𝐈𝐂𝐊𝐄𝐓 𝐃𝐄 ${data.name.toUpperCase()}`
    )
    .setDescription(`👋 **¡Bienvenido a tu ticket de ${data.name}!**

Nuestro equipo de **DICA STUDIO** está aquí para ayudarte.

${data.emoji} Selecciona una opción en el menú de abajo para continuar.

────────────────

📋 **𝐑𝐄𝐂𝐔𝐄𝐑𝐃𝐀**

✦ Explica tu solicitud claramente.
✦ Proporciona pruebas cuando sea necesario.
✦ Mantén el respeto hacia nuestro equipo.

✨ **DICA STUDIO**
*Creamos. Diseñamos. Innovamos.*`)
    .setFooter({
      text: "DICA STUDIO • Sistema de Tickets"
    });

}

// =====================================================
// ENVIAR PANEL
// =====================================================

async function sendPanel() {

  for (const guild of client.guilds.cache.values()) {

    const channel =
      guild.channels.cache.get(
        CONFIG.PANEL_CHANNEL
      );

    if (!channel || !channel.isTextBased()) {
      console.log("❌ Canal del panel no encontrado.");
      continue;
    }

    const messages =
      await channel.messages.fetch({
        limit: 20
      });

    const exists =
      messages.some(
        message =>
          message.author.id === client.user.id &&
          message.embeds.length > 0 &&
          message.embeds[0].title ===
            "🎫・𝐓𝐈𝐂𝐊𝐄𝐓𝐒 — 𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎"
      );

    if (exists) {
      console.log("ℹ️ El panel ya existe.");
      continue;
    }

    await channel.send({
      embeds: [
        createPanelEmbed()
      ],

      components: [
        createMainMenu(),
        createInviteButton()
      ]
    });

    console.log(
      `🎫 Panel enviado en #${channel.name}`
    );

  }

}

// =====================================================
// BOT READY
// =====================================================

client.once("ready", async () => {

  console.log(
    `✅ ${client.user.tag} está conectado.`
  );

  await sendPanel();

  console.log(
    "🎫 Sistema de tickets iniciado."
  );

});

// =====================================================
// INTERACCIONES
// =====================================================

client.on("interactionCreate", async interaction => {

  try {

    // =================================================
    // MENÚ PRINCIPAL
    // =================================================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket_category"
    ) {

      const category =
        interaction.values[0];

      const data =
        categories[category];

      // Buscar ticket existente
      const existing =
        interaction.guild.channels.cache.find(
          channel =>
            channel.topic ===
            `ticket:${interaction.user.id}`
        );

      if (existing) {

        return interaction.reply({
          content:
            `❌ Ya tienes un ticket abierto: ${existing}`,
          ephemeral: true
        });

      }

      const username =
        interaction.user.username
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 20);

      // =================================================
      // CREAR TICKET EN LA CATEGORÍA
      // =================================================

      const ticket =
        await interaction.guild.channels.create({

          name:
            `${data.emoji}・ticket-${username}`,

          type:
            ChannelType.GuildText,

          parent:
            CONFIG.TICKET_CATEGORY,

          topic:
            `ticket:${interaction.user.id}`,

          permissionOverwrites: [

            {
              id:
                interaction.guild.id,

              deny: [
                PermissionsBitField.Flags.ViewChannel
              ]
            },

            {
              id:
                interaction.user.id,

              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles
              ]
            },

            {
              id:
                CONFIG.STAFF_ROLE,

              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.ManageMessages
              ]
            }

          ]

        });

      // =================================================
      // RESPUESTA AL USUARIO
      // =================================================

      await interaction.reply({
        content:
          `🎫 Tu ticket ha sido creado correctamente: ${ticket}`,
        ephemeral: true
      });

      // =================================================
      // PING USER + STAFF
      // =================================================

      await ticket.send({

        content:
          `<@&${CONFIG.STAFF_ROLE}> <@${interaction.user.id}>`,

        embeds: [
          createWelcomeEmbed(category)
        ],

        components: [
          createCategoryMenu(category),
          createTicketButtons()
        ]

      });

      // =================================================
      // LOG
      // =================================================

      const logs =
        interaction.guild.channels.cache.get(
          CONFIG.LOG_CHANNEL
        );

      if (logs?.isTextBased()) {

        const embed =
          new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle(
              "🎫・𝐓𝐈𝐂𝐊𝐄𝐓 𝐂𝐑𝐄𝐀𝐃𝐎"
            )
            .setDescription(`👤 **Usuario:** <@${interaction.user.id}>

🎟️ **Ticket:** ${ticket}

📂 **Categoría:** ${data.emoji} ${data.name}

🟢 **Estado:** Abierto`)
            .setTimestamp();

        await logs.send({
          embeds: [embed]
        });

      }

      return;
    }

    // =================================================
    // MENÚ DENTRO DEL TICKET
    // =================================================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId.startsWith(
        "ticket_type:"
      )
    ) {

      const category =
        interaction.customId.split(":")[1];

      const typeId =
        interaction.values[0];

      const data =
        categories[category];

      const type =
        data.options.find(
          option =>
            option[0] === typeId
        );

      if (!type) return;

      const modal =
        new ModalBuilder()
          .setCustomId(
            `questions:${category}:${typeId}`
          )
          .setTitle(
            `${data.name} • ${type[2]}`
          );

      data.questions
        .slice(0, 5)
        .forEach(
          ([id, label, style]) => {

            const input =
              new TextInputBuilder()
                .setCustomId(id)
                .setLabel(
                  label.slice(0, 45)
                )
                .setStyle(style)
                .setRequired(true);

            modal.addComponents(
              new ActionRowBuilder()
                .addComponents(input)
            );

          }
        );

      await interaction.showModal(modal);

      return;
    }

    // =================================================
    // FORMULARIO
    // =================================================

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith(
        "questions:"
      )
    ) {

      const [
        ,
        category,
        typeId
      ] =
        interaction.customId.split(":");

      const data =
        categories[category];

      const type =
        data.options.find(
          option =>
            option[0] === typeId
        );

      const answers =
        data.questions
          .slice(0, 5)
          .map(
            ([id, question]) => ({
              question,
              answer:
                interaction.fields.getTextInputValue(
                  id
                )
            })
          );

      const requestChannel =
        interaction.guild.channels.cache.get(
          CONFIG.REQUEST_CHANNEL
        );

      if (
        !requestChannel?.isTextBased()
      ) {

        return interaction.reply({
          content:
            "❌ El canal de solicitudes no está configurado.",
          ephemeral: true
        });

      }

      const answerText =
        answers
          .map(
            a =>
              `**${a.question}**\n> ${a.answer}`
          )
          .join("\n\n");

      const embed =
        new EmbedBuilder()
          .setColor(data.color)
          .setTitle(
            "🎫・𝐍𝐔𝐄𝐕𝐀 𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃"
          )
          .setDescription(`👤 **Usuario:** <@${interaction.user.id}>

🎟️ **Ticket:** ${interaction.channel}

📂 **Categoría:** ${data.emoji} ${data.name}

📌 **Tipo:** ${type[2]}

────────────────

📝 **𝐑𝐄𝐒𝐏𝐔𝐄𝐒𝐓𝐀𝐒**

${answerText}

────────────────

🟡 **Estado:** Pendiente`)
          .setTimestamp();

      const buttons =
        new ActionRowBuilder()
          .addComponents(

            new ButtonBuilder()
              .setCustomId(
                `claim:${interaction.channel.id}:${interaction.user.id}:${category}`
              )
              .setLabel("Reclamar")
              .setEmoji("📌")
              .setStyle(
                ButtonStyle.Primary
              ),

            new ButtonBuilder()
              .setCustomId(
                `reject:${interaction.channel.id}:${interaction.user.id}:${category}`
              )
              .setLabel("Rechazar")
              .setEmoji("❌")
              .setStyle(
                ButtonStyle.Danger
              )

          );

      await requestChannel.send({

        content:
          `<@&${CONFIG.STAFF_ROLE}>`,

        embeds: [embed],

        components: [buttons]

      });

      await interaction.reply({
        content:
          "✅ Tu solicitud fue enviada al Staff.",
        ephemeral: true
      });

      return;
    }

    // =================================================
    // RECLAMAR
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId.startsWith(
        "claim:"
      )
    ) {

      if (
        !interaction.member.roles.cache.has(
          CONFIG.STAFF_ROLE
        )
      ) {

        return interaction.reply({
          content:
            "❌ Solo el Staff puede reclamar.",
          ephemeral: true
        });

      }

      const [
        ,
        channelId
      ] =
        interaction.customId.split(":");

      const channel =
        interaction.guild.channels.cache.get(
          channelId
        );

      const embed =
        EmbedBuilder.from(
          interaction.message.embeds[0]
        )
        .setColor(0xFEE75C)
        .setFooter({
          text:
            `Reclamado por ${interaction.user.tag}`
        });

      await interaction.update({
        embeds: [embed],
        components: []
      });

      if (channel) {

        await channel.send(
          `📌 **Solicitud reclamada por ${interaction.user}.**`
        );

      }

      return;
    }

    // =================================================
    // RECHAZAR
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId.startsWith(
        "reject:"
      )
    ) {

      if (
        !interaction.member.roles.cache.has(
          CONFIG.STAFF_ROLE
        )
      ) {

        return interaction.reply({
          content:
            "❌ Solo el Staff puede rechazar.",
          ephemeral: true
        });

      }

      const [
        ,
        channelId,
        userId,
        category
      ] =
        interaction.customId.split(":");

      const modal =
        new ModalBuilder()
          .setCustomId(
            `reject_modal:${channelId}:${userId}:${category}`
          )
          .setTitle(
            "🔴 Rechazar solicitud"
          );

      const reason =
        new TextInputBuilder()
          .setCustomId("reason")
          .setLabel(
            "Motivo del rechazo"
          )
          .setStyle(
            TextInputStyle.Paragraph
          )
          .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(reason)
      );

      await interaction.showModal(modal);

      return;
    }

    // =================================================
    // RECHAZO CONFIRMADO
    // =================================================

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith(
        "reject_modal:"
      )
    ) {

      const [
        ,
        channelId,
        userId,
        category
      ] =
        interaction.customId.split(":");

      const reason =
        interaction.fields.getTextInputValue(
          "reason"
        );

      // Resultado en canal de solicitudes
      const requestChannel =
        interaction.guild.channels.cache.get(
          CONFIG.REQUEST_CHANNEL
        );

      if (
        requestChannel?.isTextBased()
      ) {

        const embed =
          new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle(
              "🔴・𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃 𝐑𝐄𝐂𝐇𝐀𝐙𝐀𝐃𝐀"
            )
            .setDescription(`👤 **Usuario:** <@${userId}>

📂 **Categoría:** ${
              categories[category]?.name ||
              category
            }

👮 **Staff:** ${interaction.user}

🔴 **Estado:** Rechazado

📝 **Motivo:**
> ${reason}`)
            .setTimestamp();

        await requestChannel.send({
          embeds: [embed]
        });

      }

      // MD AL USUARIO
      const user =
        await client.users
          .fetch(userId)
          .catch(() => null);

      if (user) {

        await user
          .send(`🔴 **𝐓𝐔 𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃 𝐅𝐔𝐄 𝐑𝐄𝐂𝐇𝐀𝐙𝐀𝐃𝐀**

Tu solicitud en **DICA STUDIO** fue rechazada.

📝 **Motivo:**
> ${reason}

👮 **Staff:** ${interaction.user}`)
          .catch(() => {});

      }

      await interaction.reply({
        content:
          "🔴 Solicitud rechazada.",
        ephemeral: true
      });

      return;
    }

    // =================================================
    // AÑADIR
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId ===
        "ticket_add"
    ) {

      if (
        !interaction.member.roles.cache.has(
          CONFIG.STAFF_ROLE
        )
      ) {

        return interaction.reply({
          content:
            "❌ Solo el Staff puede añadir usuarios.",
          ephemeral: true
        });

      }

      const modal =
        new ModalBuilder()
          .setCustomId(
            "add_user_modal"
          )
          .setTitle(
            "➕ Añadir usuario"
          );

      const input =
        new TextInputBuilder()
          .setCustomId("user_id")
          .setLabel(
            "ID del usuario"
          )
          .setPlaceholder(
            "Ejemplo: 123456789012345678"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(input)
      );

      await interaction.showModal(modal);

      return;
    }

    // =================================================
    // AÑADIR CONFIRMADO
    // =================================================

    if (
      interaction.isModalSubmit() &&
      interaction.customId ===
        "add_user_modal"
    ) {

      const userId =
        interaction.fields.getTextInputValue(
          "user_id"
        );

      const member =
        await interaction.guild.members
          .fetch(userId)
          .catch(() => null);

      if (!member) {

        return interaction.reply({
          content:
            "❌ Ese usuario no está en el servidor.",
          ephemeral: true
        });

      }

      await interaction.channel
        .permissionOverwrites
        .edit(member.id, {

          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true

        });

      await interaction.reply({
        content:
          `✅ ${member} fue añadido al ticket.`
      });

      return;
    }

    // =================================================
    // CERRAR
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId ===
        "ticket_close"
    ) {

      const row =
        new ActionRowBuilder()
          .addComponents(

            new ButtonBuilder()
              .setCustomId(
                "confirm_close"
              )
              .setLabel(
                "Confirmar cierre"
              )
              .setEmoji("✅")
              .setStyle(
                ButtonStyle.Danger
              ),

            new ButtonBuilder()
              .setCustomId(
                "cancel_close"
              )
              .setLabel("Cancelar")
              .setEmoji("❌")
              .setStyle(
                ButtonStyle.Secondary
              )

          );

      await interaction.reply({
        content:
          "⚠️ **¿Estás seguro de que deseas cerrar este ticket?**",
        components: [row]
      });

      return;
    }

    // =================================================
    // CANCELAR CIERRE
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId ===
        "cancel_close"
    ) {

      await interaction.update({
        content:
          "❌ Cierre cancelado.",
        components: []
      });

      return;
    }

    // =================================================
    // CONFIRMAR CIERRE
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId ===
        "confirm_close"
    ) {

      const channel =
        interaction.channel;

      const userId =
        channel.topic?.startsWith(
          "ticket:"
        )
          ? channel.topic.split(":")[1]
          : null;

      await interaction.update({
        content:
          "🔒 Cerrando ticket...",
        components: []
      });

      // LOG
      const logs =
        interaction.guild.channels.cache.get(
          CONFIG.LOG_CHANNEL
        );

      if (logs?.isTextBased()) {

        const embed =
          new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle(
              "🔒・𝐓𝐈𝐂𝐊𝐄𝐓 𝐂𝐄𝐑𝐑𝐀𝐃𝐎"
            )
            .setDescription(`🎫 **Ticket:** #${channel.name}

👤 **Usuario:** ${
              userId
                ? `<@${userId}>`
                : "Desconocido"
            }

👮 **Cerrado por:** ${interaction.user}

🔴 **Estado:** Cerrado`)
            .setTimestamp();

        await logs.send({
          embeds: [embed]
        });

      }

      // MD
      if (userId) {

        const user =
          await client.users
            .fetch(userId)
            .catch(() => null);

        if (user) {

          await user
            .send(`🔒 **𝐓𝐈𝐂𝐊𝐄𝐓 𝐂𝐄𝐑𝐑𝐀𝐃𝐎**

Tu ticket en **DICA STUDIO** ha sido cerrado.

🎫 **Ticket:** #${channel.name}

👮 **Cerrado por:** ${interaction.user}

✨ Gracias por contactar con **DICA STUDIO**.

*Creamos. Diseñamos. Innovamos.*`)
            .catch(() => {});

        }

      }

      // Eliminar después de 5 segundos
      setTimeout(async () => {

        await channel
          .delete("Ticket cerrado")
          .catch(() => {});

      }, 5000);

      return;
    }

  } catch (error) {

    console.error(
      "❌ Error:",
      error
    );

    if (
      !interaction.replied &&
      !interaction.deferred
    ) {

      await interaction
        .reply({
          content:
            "❌ Ocurrió un error procesando esta acción.",
          ephemeral: true
        })
        .catch(() => {});

    }

  }

});

// =====================================================
// ERRORES
// =====================================================

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ Unhandled Rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ Uncaught Exception:",
      error
    );
  }
);

// =====================================================
// LOGIN
// =====================================================

if (!process.env.DISCORD_TOKEN) {

  console.error(
    "❌ Falta DISCORD_TOKEN en el archivo .env"
  );

  process.exit(1);
}

client.login(
  process.env.DISCORD_TOKEN
);
