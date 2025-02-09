const { isValidObjectId } = require("mongoose");
const Farm = require("../models/farm.model");
const FarmReport = require("../models/farmReport.model");
const Transaction = require("../models/transactions.model");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const { farmerReportSubmitSchema } = require("../validations/farmer.schema");
const User = require("../models/user.model");

module.exports = {
    fetchCoFarmersAndAgent: catchAsyncError(async (req, res, next) => {
        const keyword = req.query.search
            ? {
                  $or: [
                      { name: { $regex: req.query.search, $options: "i" } },
                      { email: { $regex: req.query.search, $options: "i" } },
                  ],
              }
            : {};

        const users = await User.find({
            $and: [
                {
                    $or: [
                        {
                            _id: req.user.agent,
                        },
                        {
                            _id: { $ne: req.user._id },
                            agent: req.user.agent,
                        },
                    ],
                },
                keyword,
            ],
        });

        res.status(200).json({
            status: true,
            data: users,
        });
    }),


    listFarms: catchAsyncError(async (req, res, next) => {
        const farms = await Farm.find({ farmer: req.user._id }).select("area").lean();

        res.status(200).json({
            status: "success",
            data: farms,
        });
    }),

    createFarmData: catchAsyncError(async (req, res, next) => {
        const { area } = req.body;

        if (!area) {
            return next(new AppError("Area of farm cannot be empty", 400));
        }

        const farm = await Farm.create({ area: area, farmer: req.user._id });

        res.status(200).json({
            status: "success",
            data: farm,
        });
    }),

    createFarmReport: catchAsyncError(async (req, res, next) => {
        const { _, error } = farmerReportSubmitSchema.validate(req.body);
    
        if (!isValidObjectId(req.params.farmId)) {
            console.log("Invalid farm ID");
            return next(new AppError("Invalid Id. Please try again", 400));
        } else {
            console.log("Valid farm ID");
        }
    
        const isFarm = await Farm.findById(req.params.farmId);
    
        if (!isFarm) {
            console.log("No farm found with provided ID");
            return next(new AppError("No farm found with provided ID", 400));
        } else {
            console.log("Farm found");
        }
    
        if (error) {
            console.log("Validation error:", error);
            return next(
                new AppError(error.details ? error?.details[0]?.message : error?.message, 400)
            );
        }
    
        const report = await FarmReport.create({
            ...req.body,
            farmer: req.user._id,
            farm: req.params.farmId,
        }).then((rprt) => rprt.populate("farmer farm"));
    
        if (!report) {
            console.log("Creating record failed.");
            return next(new AppError("Creating record failed.", 500));
        }
    
        console.log("Farm report created successfully:", report);
    
        res.status(201).json({
            status: "success",
            data: report,
        });
    }),
    


    listFarmReports: catchAsyncError(async (req, res, next) => {
        if (!isValidObjectId(req.params.id)) {
            return next(new AppError("Invalid Id. Please try again", 400));
        }

        const reports = await FarmReport.find({
            farm: req.params.id,
        })
            .sort("createdAt")
            .populate({
                path: "farmer",
                select: "name email phoneNumber",
            })
            .populate({
                path: "farm",
                select: "area",
            })
            .select("-__v -updatedAt")
            .lean();

        res.status(200).json({
            status: "success",
            data: reports,
        });
    }),


    
    listTransactions: catchAsyncError(async (req, res, next) => {
        const transaction = await Transaction.find({ farmer: req.user._id })
            .select("-__v -agent -farmer")
            .populate({
                path: "farm",
                select: "area",
            })
            .lean();

        res.status(200).json({
            status: "success",
            data: transaction,
        });
    }),



};
