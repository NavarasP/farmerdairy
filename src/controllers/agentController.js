const { isValidObjectId } = require("mongoose");
const FarmReport = require("../models/farmReport.model");
const Transaction = require("../models/transactions.model");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const { createTransactionSchema } = require("../validations/agent.schema");
const User = require("../models/user.model");
const Farm = require("../models/farm.model");

module.exports = {
    fetchfarmers: catchAsyncError(async (req, res, next) => {
        const keyword = req.query.search
            ? {
                  $or: [
                      { name: { $regex: req.query.search, $options: "i" } },
                      { email: { $regex: req.query.search, $options: "i" } },
                  ],
              }
            : {};

        const users = await User.find({
            agent: req.user._id,
            ...keyword,
        });

        res.status(200).json({
            status: true,
            data: users,
        });
    }),

    listFarmsOfFarmer: catchAsyncError(async (req, res, next) => {
        if (!isValidObjectId(req.params.farmerId)) {
            return next(new AppError("Invalid Farmer Id. Please try again", 400));
        }
        
        // Assuming there's a field in Farm model linking it to the farmer
        const farms = await Farm.find({ farmer: req.params.farmerId }).lean();

        if (!farms || farms.length === 0) {
            return next(new AppError("There are no farms found for this farmer", 404));
        }

        res.status(200).json({
            status: "success",
            data: farms,
        });
    }),






    getReportsToday: catchAsyncError(async (req, res, next) => {
        if (!isValidObjectId(req.params.farmerId)) {
            return next(new AppError("Invalid Id. Please try again", 400));
        }
        const today = new Date();
        const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const report = await FarmReport.findOne({
            farmer: req.params.farmerId,
            createdAt: { $gt: dayStart },
        }).lean();

        if (!report) {
            return next(new AppError("There is no report found today", 404));
        }

        res.status(200).json({
            status: "success",
            data: report,
        });
    }),
    
    getReports: catchAsyncError(async (req, res, next) => {
        if (!isValidObjectId(req.params.farmId)) {
            return next(new AppError("Invalid Id. Please try again", 400));
        }
    
        const reports = await FarmReport.find({
            farm: req.params.farmId,
        }).lean();
    
        if (!reports || reports.length === 0) {
            return next(new AppError("There are no reports found for this farmer", 404));
        }
    
        res.status(200).json({
            status: "success",
            data: reports,
        });
    }),
    
    acknowledgeReport: catchAsyncError(async (req, res, next) => {
        if (!isValidObjectId(req.params.reportId)) {
            return next(new AppError("Invalid Id. Please try again", 400));
        }

        const report = await FarmReport.findByIdAndUpdate(
            req.params.reportId,
            { isAcknowledged: true },
            {
                new: true,
            }
        );

        if (!report) {
            return next(new AppError("There is no report found", 404));
        }

        res.status(200).json({
            status: "success",
            data: report,
        });
    }),

    createTradeToFarmer: catchAsyncError(async (req, res, next) => {
        const { _, error } = createTransactionSchema.validate(req.body);

        if (error) {
            return next(
                new AppError(error.details ? error?.details[0]?.message : error?.message, 400)
            );
        }

        const transaction = await Transaction.create({ ...req.body, agent: req.user._id });

        if (!transaction) {
            return next(new AppError("Create transaction failed", 500));
        }

        res.status(201).json({
            status: "success",
            message: "Transaction created successfully!",
            data: transaction,
        });
    }),


    listTransactionsOfFarm: catchAsyncError(async (req, res, next) => {
        // Extract the farm ID from the request parameters
        if (!isValidObjectId(req.params.farmId)) {
            return next(new AppError("Invalid Farmer Id. Please try again", 400));
        }
        // Query the database for transactions associated with the given farm ID
        const transactions = await Transaction.find({ farm: req.params.farmId }).lean();
    
        // Check if any transactions were found
        if (!transactions || transactions.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "No transactions found for the specified farm",
                data: null
            });
        }
    
        // Return the list of transactions
        res.status(200).json({
            status: "success",
            message: "Transactions retrieved successfully",
            data: transactions
        });
    }),


    getFarmName: catchAsyncError(async (req, res, next) => {
        // Finding the user with the user ID provided in the request parameters
        const farm = await Farm.findById(req.params.id);
    
        // If no user is found, return an error
        if (!farm) {
            return next(new AppError("User not found", 404));
        }
    
        // Sending the user's email as a response
        res.status(200).json({
            status: "success",
            data: farm.area,
        });
    }),
    
};
