const OfferModel = require("../models/offer-model");
const JobModel = require("../models/job-model");
const ProposalModel = require("../models/proposal-model");
const SellerModel = require("../models/seller-model");
const ClientModel = require("../models/client-model");
const CommunicationModel = require("../models/communication-model");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const supportMail = process.env.SUPPORT_MAIL;
const supportPhone = process.env.SUPPORT_PHONE;
const corsUrl = process.env.CORS_URL;

// get all Offer
async function getOneOffer(req, res) {
  const { id } = req.params;
  try {
    const Offer = await OfferModel.findOne({ _id: id });
    res.status(200).json(Offer);
  } catch (error) {
    res.status(500).json(error);
  }
}

// get one offer by jobId
async function getOneOfferByJobId(req, res) {
  const { id } = req.params;
  const { sellerId } = req.query;
  try {
    const Offer = await OfferModel.findOne({ jobId: id, sellerId: sellerId });
    res.status(200).json(Offer);
  } catch (error) {
    res.status(500).json(error);
  }
}

// get all Offer default
async function getAllOfferDefault(req, res) {
  try {
    const Offer = await OfferModel.find();
    res.status(200).json(Offer);
  } catch (error) {
    res.status(500).json(error);
  }
}

// get all offer
async function getAllOffer(req, res) {
  try {
    const { page = 1, limit = 20, id = "", sellerId = "" } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    if (sellerId) {
      filter.sellerId = sellerId;
    }
    if (id) {
      filter.jobId = id;
    }
    const offers = await OfferModel.find(filter).skip(skip).limit(limitNumber);

    const totalOffers = await OfferModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOffers / limitNumber);
    const sellerIds = [...new Set(offers.map((p) => p.sellerId))];
    const clientIds = [...new Set(offers.map((p) => p.clientId))];
    const jobIds = [...new Set(offers.map((p) => p.jobId))];
    const sellers = await SellerModel.find({ _id: { $in: sellerIds } });
    const clients = await ClientModel.find({ _id: { $in: clientIds } });
    const jobs = await JobModel.find({ _id: { $in: jobIds } });
    const sellerDataMap = sellers.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const clientDataMap = clients.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const jobMap = jobs.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const detailedParticipations = offers.map((participation) => ({
      ...participation._doc,
      sellerData: sellerDataMap[participation.sellerId.toString()] || null,
      clientData: clientDataMap[participation.clientId.toString()] || null,
      jobData: jobMap[participation.jobId.toString()] || null,
    }));

    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalOffers,
      offers: detailedParticipations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// get all offer
async function getAllOfferBySeller(req, res) {
  try {
    const { page, limit, status, sellerId } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    if (sellerId) {
      filter.sellerId = sellerId;
    }
    if (status) {
      filter.status = status;
    }
    const offers = await OfferModel.find(filter).skip(skip).limit(limitNumber);
    const totalOffers = await OfferModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOffers / limitNumber);
    const sellerIds = [...new Set(offers.map((p) => p.sellerId))];
    const clientIds = [...new Set(offers.map((p) => p.clientId))];
    const jobIds = [...new Set(offers.map((p) => p.jobId))];
    const sellers = await SellerModel.find({ _id: { $in: sellerIds } });
    const clients = await ClientModel.find({ _id: { $in: clientIds } });
    const jobs = await JobModel.find({ _id: { $in: jobIds } });
    const sellerDataMap = sellers.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const clientDataMap = clients.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const jobMap = jobs.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const detailedParticipations = offers.map((participation) => ({
      ...participation._doc,
      sellerData: sellerDataMap[participation.sellerId.toString()] || null,
      clientData: clientDataMap[participation.clientId.toString()] || null,
      jobData: jobMap[participation.jobId.toString()] || null,
    }));

    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalOffers,
      offers: detailedParticipations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// get all offer
async function getAllOfferBySellerBoth(req, res) {
  try {
    const { page = 1, limit = 10, status, sellerId } = req.query;

    // Convert page and limit to numbers with default fallback
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Split the status string by commas if it's a string, otherwise handle as array
    const statusArray = typeof status === "string" ? status.split(",") : [];

    // Construct the filter
    const filter = {
      sellerId: sellerId || undefined, // Make sure sellerId is valid
      ...(statusArray.length > 0 && { status: { $in: statusArray } }), // Only add status filter if non-empty
    };

    // Perform the query
    const offers = await OfferModel.find(filter).skip(skip).limit(limitNumber);

    // Get total number of offers matching the filter
    const totalOffers = await OfferModel.countDocuments(filter);

    // Calculate total pages for pagination
    const totalPages = Math.ceil(totalOffers / limitNumber);

    // Process related data (sellers, clients, jobs)
    const sellerIds = [...new Set(offers.map((p) => p.sellerId))];
    const clientIds = [...new Set(offers.map((p) => p.clientId))];
    const jobIds = [...new Set(offers.map((p) => p.jobId))];

    // Fetch related data
    const sellers = await SellerModel.find({ _id: { $in: sellerIds } });
    const clients = await ClientModel.find({ _id: { $in: clientIds } });
    const jobs = await JobModel.find({ _id: { $in: jobIds } });

    // Create data maps for fast lookup
    const sellerDataMap = sellers.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const clientDataMap = clients.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const jobMap = jobs.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    // Combine offer data with related data
    const detailedParticipations = offers.map((participation) => ({
      ...participation._doc,
      sellerData: sellerDataMap[participation.sellerId.toString()] || null,
      clientData: clientDataMap[participation.clientId.toString()] || null,
      jobData: jobMap[participation.jobId.toString()] || null,
    }));

    // Send response with pagination and detailed offer data
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalOffers,
      offers: detailedParticipations,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: error.message });
  }
}

// get all offer
async function getOneOfferByBoth(req, res) {
  try {
    const { jobId = "", sellerId = "" } = req.query;

    // Build the filter object for the query
    const filter = {};
    if (sellerId) filter.sellerId = sellerId;
    if (jobId) filter.jobId = jobId;

    // Find one offer that matches both sellerId and jobId
    const offer = await OfferModel.findOne(filter);

    if (!offer) {
      return res
        .status(404)
        .json({ message: "No offer found with the given sellerId and jobId." });
    }

    // Fetch the associated seller, job, and client using the IDs in the offer
    const sellerData = await SellerModel.findById(offer.sellerId);
    const clientData = await ClientModel.findById(offer.clientId);
    const jobData = await JobModel.findById(offer.jobId);

    // Construct a single response object with the detailed data
    const detailedParticipation = {
      ...offer._doc,
      sellerData: sellerData || null,
      clientData: clientData || null,
      jobData: jobData || null,
    };

    res.status(200).json(detailedParticipation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// get all offer
async function getAllOfferByClient(req, res) {
  try {
    const { clientId, page, limit, reviewSubmited, status } = req.query;
    const filter = {};
    if (clientId) {
      filter.clientId = clientId;
      filter.reviewSubmited = reviewSubmited;
    }
    if (status) {
      filter.status = status;
    }
    let offers,
      totalOffers,
      totalPages = 1;

    if (page && limit) {
      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      offers = await OfferModel.find(filter).skip(skip).limit(limitNumber);
      totalOffers = await OfferModel.countDocuments(filter);
      totalPages = Math.ceil(totalOffers / limitNumber);
    } else {
      offers = await OfferModel.find(filter);
      totalOffers = offers.length;
    }

    const sellerIds = [...new Set(offers.map((p) => p.sellerId))];
    const clientIds = [...new Set(offers.map((p) => p.clientId))];
    const jobIds = [...new Set(offers.map((p) => p.jobId))];
    const sellers = await SellerModel.find({ _id: { $in: sellerIds } });
    const clients = await ClientModel.find({ _id: { $in: clientIds } });
    const jobs = await JobModel.find({ _id: { $in: jobIds } });

    const sellerDataMap = sellers.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const clientDataMap = clients.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const jobMap = jobs.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const detailedParticipations = offers.map((participation) => ({
      ...participation._doc,
      sellerData: sellerDataMap[participation.sellerId.toString()] || null,
      clientData: clientDataMap[participation.clientId.toString()] || null,
      jobData: jobMap[participation.jobId.toString()] || null,
    }));

    res.status(200).json({
      currentPage: page ? parseInt(page, 10) : 1,
      totalPages,
      totalOffers,
      offers: detailedParticipations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// perticipation job
async function createPerticipation(req, res) {
  const { jobId, sellerId, bidMessage, jobCredit } = req.body;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const existJob = await JobModel.findOne({ _id: jobId });
  const email = existJob?.jobEmail;
  const existClient = await ClientModel.findOne({ email: email });
  const existoffer = await OfferModel.findOne({ jobId: jobId });
  const { username, credits } = existSeller || {};
  const { _id } = existClient || {};
  const { jobTitle, placeBid } = existJob || {};

  try {
    if (existoffer?.length >= 5) {
      return res.status(400).json({ message: "No more bid are accepted" });
    }
    if (credits >= jobCredit) {
      const updateSellerCredit = {
        credits: credits - jobCredit,
      };
      const PerticipationData = new OfferModel({
        sellerId: sellerId,
        clientId: _id,
        jobId: jobId,
        bidMessage: bidMessage,
        status: "pending",
        view: "unseen",
      });
      const communicationData = new CommunicationModel({
        clientId: _id,
        jobId,
        sellerId,
        view: "unseen",
        sellerMessage: bidMessage
          ? [
              {
                message: bidMessage,
                date: new Date(),
                time: new Date().getTime(),
              },
            ]
          : [],
      });
      const bid = placeBid > 0 ? placeBid + 1 : 1;
      const UpdateJob = {
        placeBid: bid,
      };
      await sendEmailNotification(
        username,
        email,
        `You have received a new request from ${username}`,
        `${username} send a request to your job: ${jobTitle}. Please check your dashboard to see the perticipation.`,
        username
      );
      await communicationData.save();
      await PerticipationData.save();
      await SellerModel.findByIdAndUpdate(sellerId, updateSellerCredit, {
        new: true,
      });
      await JobModel.findByIdAndUpdate(jobId, UpdateJob, {
        new: true,
      });
      res.status(200).json({ message: "Perticipation Successful" });
    } else {
      res.status(400).json({ message: "You do not have enough credit!" });
    }
  } catch (error) {
    res.status(500).json({ error: error, message: "Perticipation Faild!" });
  }
}

// make request offer
async function makeOfferRequest(req, res) {
  const { jobId, sellerId, offerMessage } = req.body;
  const id = req.params.id;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const { email } = existSeller || {};
  const existJob = await JobModel.findOne({ _id: jobId });
  const clientEmail = existJob?.jobEmail;
  const existClient = await ClientModel.findOne({ email: clientEmail });
  const existCommunication = await CommunicationModel.findOne({
    jobId: jobId,
    sellerId: sellerId,
  });

  const { firstname, lastname } = existClient || {};
  const { jobTitle } = existJob || {};
  try {
    const requestData = {
      offerMessage,
      status: "request",
      offerRequested: true,
      offerRequestedNotify: true,
    };
    if (existCommunication) {
      let updateCommunication = {
        $push: {},
        offerRequest: true,
      };
      updateCommunication.$push.clientMessage = {
        message: `We will ask you to make a proposal request and send your best offer. We will check it shortly.\n ${
          offerMessage &&
          `<p style="font-weight: bold; color: #777; font-size: 18px">Message: </p>${offerMessage}`
        }`,
        date: new Date(),
        time: new Date().getTime(),
      };
      await CommunicationModel.findByIdAndUpdate(
        existCommunication?._id,
        updateCommunication,
        { new: true }
      );
      await sendEmailNotification(
        firstname + " " + lastname,
        email,
        `${firstname + " " + lastname} send offer request`,
        `${
          firstname + " " + lastname
        } ask you to make offer to this job: ${jobTitle}. Please login to your dashboard and make a offer request. ${
          offerMessage &&
          `<p style="font-weight: bold; color: #777; font-size: 18px">${
            firstname + " " + lastname
          } Message: </p>${offerMessage}`
        }`,
        firstname + " " + lastname
      );
      await OfferModel.findByIdAndUpdate(id, requestData, { new: true });
    }
    res.status(200).json({ message: "Request Send Successful" });
  } catch (error) {
    res.status(500).json({ error: error, message: "Request Send Faild!" });
  }
}

// make request offer
async function sendBidRequest(req, res) {
  const { offerPrice, priceUnit, offerNote, sellerId, jobId } = req.body;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const { username } = existSeller || {};
  const existJob = await JobModel.findOne({ _id: jobId });
  const { jobTitle, jobEmail, offerRequest } = existJob || {};
  const existClient = await ClientModel.findOne({ email: jobEmail });
  const { email } = existClient || {};
  const existOffer = await OfferModel.findOne({
    jobId: jobId,
    sellerId: sellerId,
  });

  const existCommunication = await CommunicationModel.findOne({
    jobId: jobId,
    sellerId: sellerId,
  });

  try {
    if (!existOffer.offerRequested) {
      return res
        .status(400)
        .json({ message: "You are not eligble to send bid" });
    } else if (existOffer.offerPlaced) {
      return res.status(400).json({ message: "You are already bid" });
    } else {
      let file;
      if (req.file) {
        file = req.file.location;
      }
      if (existCommunication) {
        const requestData = {
          offerPrice,
          priceUnit,
          offerNote,
          offerFiles: file,
          status: "submit",
          offerPlaced: true,
          offerPlacedNotify: true,
          offerRequestedNotify: false,
        };

        await sendBidEmail(
          username,
          email,
          `${username} place a bid on ${jobTitle}`,
          username,
          offerPrice,
          priceUnit,
          offerNote
        );

        let updateData = { $push: {} };
        updateData.$push.sellerMessage = {
          message: `price unit: ${priceUnit}\n offer price: ${offerPrice}\n offer note: ${offerNote}${
            req.file
              ? `\n offer file: <br> <a style="color: #777; font-weight: bold;" href="${req.file.location}" download>Download offer file</a>`
              : ""
          }`,
          date: new Date(),
          time: new Date().getTime(),
        };
        const jobData = {
          offerRequest: offerRequest > 0 ? offerRequest + 1 : 1,
        };
        await CommunicationModel.findByIdAndUpdate(
          existCommunication?._id,
          updateData,
          { new: true }
        );
        await OfferModel.findByIdAndUpdate(existOffer?._id, requestData, {
          new: true,
        });
        await JobModel.findByIdAndUpdate(existJob?._id, jobData, {
          new: true,
        });
      }
    }
    res.status(200).json({ message: "Bid Successful" });
  } catch (error) {
    res.status(500).json({ error: error, message: "Bid Faild!" });
  }
}

// update offer request status
async function updateOfferRequest(req, res) {
  const { status, sellerId, jobId } = req.body;
  const id = req.params.id;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const existJob = await JobModel.findOne({ _id: jobId });
  const { jobTitle, jobEmail, rejectBid, _id, placeBid } = existJob || {};
  const existClient = await ClientModel.findOne({ email: jobEmail });
  const existCommunication = await CommunicationModel.findOne({
    jobId: jobId,
    sellerId: sellerId,
  });
  const { username: sellerName, email } = existSeller || {};
  const { username } = existClient || {};
  try {
    const acceptData = {
      status: "accept",
      offerAccepted: true,
      offerPlacedNotify: false,
    };
    const rejectData = {
      status: "reject",
      offerRejected: true,
      offerPlacedNotify: false,
      offerRequestedNotify: false,
    };
    const acceptJobData = {
      status: "close",
    };
    const rejectJobData = {
      rejectBid: rejectBid > 0 ? rejectBid + 1 : 1,
      placeBid: placeBid > 0 ? placeBid - 1 : 0,
    };
    if (status === "accept") {
      let updateData = { $push: {} };
      updateData.$push.clientMessage = {
        message: `GOOD NEWS, your proposal is accepted.`,
        date: new Date(),
        time: new Date().getTime(),
      };
      await CommunicationModel.findByIdAndUpdate(
        existCommunication?._id,
        updateData,
        { new: true }
      );
      await sendEmailNotification(
        username,
        email,
        `${username} accept your offer in this job: ${jobTitle}`,
        `${sellerName} you have a good news. ${username} accept your offer. Please login to your dashboard and go to won tab to see this update.`,
        username
      );
      await JobModel.findByIdAndUpdate(jobId, acceptJobData, { new: true });
      await OfferModel.findByIdAndUpdate(id, acceptData, { new: true });
      const otherOffers = await OfferModel.find({
        jobId: jobId,
        _id: { $ne: id },
      });
      for (const offer of otherOffers) {
        const rejectSeller = await SellerModel.findById(offer.sellerId);
        const rejectCommunication = await CommunicationModel.findOne({
          jobId: jobId,
          sellerId: offer.sellerId,
        });

        // Send rejection email to other sellers
        await sendEmailNotification(
          username,
          rejectSeller.email,
          `${username} rejected your offer`,
          `Sorry to inform you that ${username} did not accept your offer for the job: ${jobTitle}. Please log in to your dashboard for more details.`,
          username
        );

        // Push rejection message to communication
        let rejectUpdateData = { $push: {} };
        rejectUpdateData.$push.clientMessage = {
          message: `We are sorry to inform you that your proposal was rejected.`,
          date: new Date(),
          time: new Date().getTime(),
        };
        await CommunicationModel.findByIdAndUpdate(
          rejectCommunication?._id,
          rejectUpdateData,
          { new: true }
        );

        // Update offer status to rejected
        await OfferModel.findByIdAndUpdate(offer._id, rejectData, {
          new: true,
        });
        await JobModel.findByIdAndUpdate(offer.jobId, rejectJobData, {
          new: true,
        });
      }
    } else {
      let updateData = { $push: {} };
      updateData.$push.clientMessage = {
        message: `We are sorry to inform you that your proposal was rejected.`,
        date: new Date(),
        time: new Date().getTime(),
      };
      await sendEmailNotification(
        username,
        email,
        `${username} reject your offer`,
        `Sorry to inform you that ${username} did not accept your offer for the job: ${jobTitle}. Please log in to your dashboard for more details.`,
        username
      );
      await CommunicationModel.findByIdAndUpdate(
        existCommunication?._id,
        updateData,
        { new: true }
      );
      await JobModel.findByIdAndUpdate(_id, rejectJobData, { new: true });
      await OfferModel.findByIdAndUpdate(id, rejectData, { new: true });
    }
    res.status(200).json({ message: `Offer ${status}` });
  } catch (error) {
    res.status(500).json({ error: error, message: "Request Send Faild!" });
  }
}

// create Offer
async function createOffer(req, res) {
  const { jobId, sellerId, clientId, message, perticipationId } = req.body;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const existClient = await ClientModel.findOne({ _id: clientId });
  const id = sellerId;
  try {
    const existOffer = await OfferModel.findOne({
      perticipationId: perticipationId,
    });
    const existJob = await JobModel.findOne({
      _id: jobId,
    });
    const existProposal = await ProposalModel.findOne({
      jobId: jobId,
      sellerId: sellerId,
    });

    if (existProposal) {
      return res.status(400).json({ message: "Already have a proposal" });
    }
    if (existOffer) {
      return res.status(400).json({ message: "Already send a request" });
    }
    if (existSeller.credits < 2) {
      return res
        .status(400)
        .json({ message: "Seller does not have enough credits" });
    }
    const existCommunication = await CommunicationModel.findOne({
      jobId: jobId,
      sellerId: sellerId,
    });
    if (existCommunication) {
      let updateCommunication = { $push: {} }; // Initialize $push as an object
      updateCommunication.$push.clientMessage = {
        message: `We will ask you to make a proposal request and send your best offer. We will check it shortly.\n ${
          message &&
          `<p style="font-weight: bold; color: #777; font-size: 18px">Message: </p>${message}`
        }`,
        date: new Date(),
        time: new Date().getTime(),
      };

      await sendEmailNotification(
        existSeller.username,
        existSeller.email,
        `You have received a new message from ${existClient?.username}`,
        `Client Name: ${existClient?.username} <br> Client Phone Number: ${
          existClient?.phone
        }<br> Client Email: ${existClient?.email} <br> ${
          message && `message: ${message}`
        }`,
        existClient?.username
      );
      await CommunicationModel.findByIdAndUpdate(
        existCommunication?._id,
        updateCommunication,
        { new: true }
      );
    }
    const OfferData = new OfferModel({
      jobId,
      sellerId,
      clientId,
      message,
      perticipationId,
      jobTitle: existJob?.jobTitle,
    });
    const updateData = {
      credits: existSeller.credits ? existSeller.credits - 2 : 0,
    };
    await SellerModel.findByIdAndUpdate(id, updateData, { new: true });
    await OfferData.save();
    res.status(200).json({ message: "Request send" });
  } catch (error) {
    res.status(500).json({ error: error, message: "request Faild!" });
  }
}

// send email when send offer
async function sendBidEmail(
  name,
  email,
  subject,
  receiveName,
  offerPrice,
  priceUnit,
  offerNote
) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  });
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Suisse-Offerten",
      link: "http://suisse-offerten.ch/",
    },
  });
  const emailTemplate = {
    body: {
      name: `${name}`,
      intro: `You have received a new offer from ${receiveName}:`,
      outro: `
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px; display: flex; gap: 5px">
          <strong style="font-size: 16px;">Offer Price: </strong>
          <p style="font-size: 14px; color: #555;">${offerPrice}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px; display: flex; gap: 5px">
          <strong style="font-size: 16px;">Offer Unit: </strong>
          <p style="font-size: 14px; color: #555;">${priceUnit}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px; display: flex; gap: 5px">
          <strong style="font-size: 16px;">Offer Note: </strong>
          <p style="font-size: 14px; color: #555;">${offerNote}</p>
        </div>
        <p style="font-size: 14px; color: #777;">Please login to your account to reply to this message.</p>
        <p style="font-size: 14px; color: #777; margin-top: 20px;">Suisse-Offerten</p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">Suisse-Offerten</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>
        <p style="font-size: 14px; color: #777;">Tel: ${supportPhone}</p>
      `,
    },
  };

  const emailBody = mailGenerator.generate(emailTemplate);
  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: subject,
    html: emailBody,
  };
  await transporter.sendMail(mailOptions);
}

// update offer view
async function updateOfferView(req, res) {
  const { clientId, jobId } = req.body;
  try {
    const filter = {
      jobId: jobId,
      clientId: clientId,
    };
    const updateView = {
      view: "seen",
    };
    await OfferModel.updateMany(filter, updateView);
    res.status(200).json({
      message: "communications marked as seen.",
    });
  } catch (error) {
    res.status(500).json({ error: error, message: "Update Faild!" });
  }
}

// update offer details
async function updateOfferDetails(req, res) {
  const { offerPrice, priceUnit, offerNote } = req.body;
  const id = req.params.id;
  try {
    let file;
    if (req.file) {
      file = req.file.location;
    }
    const updateOffer = {
      offerPrice,
      priceUnit,
      offerNote,
      offerFiles: file,
    };

    await OfferModel.findByIdAndUpdate(id, updateOffer, { new: true });
    res.status(200).json({
      message: "Update Successful",
    });
  } catch (error) {
    res.status(500).json({ error: error, message: "Update Faild!" });
  }
}

// offer review request
async function offerReviewRequest(req, res) {
  const { id } = req.params;
  try {
    let existProposal = await OfferModel.findOne({ _id: id });
    if (existProposal) {
      let updateData = {
        reviewRequest: true,
      };
      await OfferModel.findByIdAndUpdate(id, updateData, { new: true });
      res.status(200).json({ message: "Review request send" });
    } else {
      res.status(400).json("Data not found!");
    }
  } catch (error) {
    res.status(500).json(error);
  }
}

// offer archive request
async function offerArchiveRequest(req, res) {
  const { id } = req.params;
  try {
    let existProposal = await OfferModel.findOne({ _id: id });
    if (existProposal) {
      let updateData = {
        offerArchived: true,
      };
      await OfferModel.findByIdAndUpdate(id, updateData, { new: true });
      res.status(200).json({ message: "Offer Archived" });
    } else {
      res.status(400).json("Data not found!");
    }
  } catch (error) {
    res.status(500).json(error);
  }
}

// send notification email
async function sendEmailNotification(
  name,
  email,
  subject,
  message,
  receiveName
) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  });
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Suisse-Offerten",
      link: "http://suisse-offerten.ch/",
    },
  });
  const emailTemplate = {
    body: {
      name: `${name}`,
      intro: `You have received a new message from ${receiveName}:`,
      outro: `
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">Message:</strong>
          <p style="font-size: 14px; color: #555;">${message}</p>
        </div>
        <p style="font-size: 14px; color: #777;">Please login to your account to reply to this message.</p>
        <p style="font-size: 14px; color: #777; margin-top: 20px;">Suisse-Offerten</p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">Suisse-Offerten</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>
        <p style="font-size: 14px; color: #777;">Tel: ${supportPhone}</p>
      `,
    },
  };
  emailTemplate.body.message = `${message}`;
  const emailBody = mailGenerator.generate(emailTemplate);
  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: subject,
    html: emailBody,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = {
  getAllOffer,
  createOffer,
  getOneOffer,
  getOneOfferByJobId,
  getAllOfferDefault,
  createPerticipation,
  makeOfferRequest,
  sendBidRequest,
  updateOfferRequest,
  updateOfferView,
  getAllOfferByClient,
  getOneOfferByBoth,
  getAllOfferBySeller,
  getAllOfferBySellerBoth,
  updateOfferDetails,
  offerReviewRequest,
  offerArchiveRequest,
};
