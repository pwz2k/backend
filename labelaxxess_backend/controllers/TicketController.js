const Tickets = require("../models/TicketModel");
const TicketMessages = require("../models/TicketMessage");
const User = require("../models/User");
const Admin = require("../models/AdminModel");

async function getUser(req) {
  const { authorization } = req.headers;
  if (!authorization) return false;
  const userId = await helpers.verifyToken(authorization);
  if (!userId) return false;
  const user = await User.findOne({ where: { id: userId } });
  if (!user) return false;
  return user;
}

async function getAdmin(req) {
  const { authorization } = req.headers;
  if (!authorization) return false;
  const adminId = await helpers.verifyToken(authorization);
  if (!adminId) return false;
  const admin = await Admin.findOne({ where: { id: adminId } });
  if (!admin) return false;
  return admin;
}

module.exports = {
  createTicket: async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { subject, message } = req.body;

      const ticket = await Tickets.create({
        user: user.id,
        subject,
        lastMessageFrom: user.email,
      });

      await TicketMessages.create({
        ticketId: ticket.id,
        message,
        from: user.email,
      });

      await helpers.sendTelegramMessage(`
        New Ticket Created\n
        Subject: ${subject}\n
        Message: ${message}\n
        User: ${user.email}
      `);

      return helpers.createResponse(
        res,
        constants.SUCCESS,

        messages.MODULE_STATUS_CHANGE("Ticket", "created")
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  readTickets: async (req, res) => {
    try {
      const user = await getUser(req);
      const admin = await getAdmin(req);
      if (!user && !admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      var searchQuery = {};
      const { page, search } = req.body;
      if (search) {
        searchQuery = {
          subject: {
            $or: [{ $like: `%${search}%` }, { id: search }],
          },
        };
      }

      var tickets = {};
      var totalTickets = 0;
      if (user) {
        tickets = await Tickets.findAll({
          where: { user: user.id, ...searchQuery },
          limit: 20 * page,
          offset: 20 * (page - 1),
          order: [["createdAt", "DESC"]],
        });
        totalTickets = await Tickets.count({
          where: { user: user.id, ...searchQuery },
        });
      } else {
        tickets = await Tickets.findAll({
          where: { ...searchQuery },
          limit: 20 * page,
          offset: 20 * (page - 1),
          order: [["createdAt", "DESC"]],
        });
        totalTickets = await Tickets.count({
          where: { ...searchQuery },
        });
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_LIST("Tickets"),
        {
          tickets,
          pager: {
            total: totalTickets,
            page,
            perPage: 20,
            search,
            totalPage: Math.ceil(totalTickets / 20),
          },
        }
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  getTicket: async (req, res) => {
    try {
      const user = await getUser(req);
      const admin = await getAdmin(req);
      if (!user && !admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { id } = req.params;

      var ticket = "";
      if (user)
        ticket = await Tickets.findOne({
          where: { id, user: user.id },
        });
      else
        ticket = await Tickets.findOne({
          where: { id },
        });

      if (!ticket)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Ticket")
        );

      const messages = await TicketMessages.findAll({
        where: { ticketId: ticket.id },
      });

      return helpers.createResponse(res, constants.SUCCESS, "Ticker List", {
        ticket,
        messages,
      });
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  sendMessage: async (req, res) => {
    try {
      const user = await getUser(req);
      const admin = await getAdmin(req);
      if (!user && !admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { id, message } = req.body;

      var ticket = "";
      if (user)
        ticket = await Tickets.findOne({
          where: { id, user: user.id },
        });
      else
        ticket = await Tickets.findOne({
          where: { id },
        });

      if (!ticket)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Ticket")
        );

      if (user) {
        await TicketMessages.create({
          ticketId: ticket.id,
          message,
          from: user.email,
        });

        await helpers.sendTelegramMessage(`
          New Message From User\n
          Ticket ID: ${ticket.id}\n
          Message: ${message}\n
          User: ${user.email}
      `);
      } else
        await TicketMessages.create({
          ticketId: ticket.id,
          message,
          from: "Admin",
        });

      await Tickets.update(
        { lastMessageFrom: user ? user.email : "Admin" },
        { where: { id: ticket.id } }
      );

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Ticket", "updated")
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  closeTicket: async (req, res) => {
    try {
      const user = await getUser(req);
      const admin = await getAdmin(req);
      if (!user && !admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { id } = req.params;

      var ticket = "";
      if (user)
        ticket = await Tickets.findOne({
          where: { id, user: user.id },
        });
      else
        ticket = await Tickets.findOne({
          where: { id },
        });

      if (!ticket)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Ticket")
        );

      if (user) {
        await Tickets.update(
          { status: "closed" },
          { where: { id: ticket.id, user: user.id } }
        );

        await helpers.sendTelegramMessage(`
          Ticket Closed By User\n
          Ticket ID: ${ticket.id}\n
          User: ${user.email}
        `);
      } else
        await Tickets.update(
          { status: "closed" },
          { where: { id: ticket.id } }
        );

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Ticket", "updated")
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  openTicket: async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { id } = req.params;

      var ticket = (ticket = await Tickets.findOne({
        where: { id, user: user.id },
      }));

      if (!ticket)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Ticket")
        );

      await Tickets.update(
        { status: "open" },
        { where: { id: ticket.id, user: user.id } }
      );

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Ticket", "updated")
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },
};
