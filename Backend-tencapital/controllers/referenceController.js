class ReferenceController {
  constructor(Model, modelName) {
    this.Model = Model;
    this.modelName = modelName;
  }

  // Create a new reference item
  async create(req, res) {
    try {
      const { name, description, isActive = true } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: `${this.modelName} name is required`
        });
      }

      // Check if name already exists
      const existingItem = await this.Model.findOne({ name });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: `${this.modelName} with this name already exists`
        });
      }

      const item = await this.Model.create({
        name,
        description,
        isActive
      });

      res.status(201).json({
        success: true,
        message: `${this.modelName} created successfully`,
        data: item
      });
    } catch (error) {
      console.error(`Create ${this.modelName} error:`, error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all reference items
  async getAll(req, res) {
    try {
      const { includeInactive = false } = req.query;
      
      let items;
      if (includeInactive === 'true') {
        items = await this.Model.findAllWithInactive();
      } else {
        items = await this.Model.findAll();
      }

      res.json({
        success: true,
        data: items,
        count: items.length
      });
    } catch (error) {
      console.error(`Get all ${this.modelName} error:`, error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get reference item by ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const item = await this.Model.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${this.modelName} not found`
        });
      }

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error(`Get ${this.modelName} by ID error:`, error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update reference item
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const item = await this.Model.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${this.modelName} not found`
        });
      }

      // Check if new name already exists (if name is being updated)
      if (updateData.name && updateData.name !== item.name) {
        const existingItem = await this.Model.findOne({ 
          name: updateData.name,
          _id: { $ne: id }
        });
        if (existingItem) {
          return res.status(400).json({
            success: false,
            message: `${this.modelName} with this name already exists`
          });
        }
      }

      await item.updateLocation ? 
        await item.updateLocation(updateData) :
        await item.updateInvestorType ? 
        await item.updateInvestorType(updateData) :
        await item.updateSector ? 
        await item.updateSector(updateData) :
        await item.updateIndustry ? 
        await item.updateIndustry(updateData) :
        await item.updateInvestmentStage ? 
        await item.updateInvestmentStage(updateData) :
        await item.updateRevenueCriteria(updateData);

      res.json({
        success: true,
        message: `${this.modelName} updated successfully`,
        data: item
      });
    } catch (error) {
      console.error(`Update ${this.modelName} error:`, error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete reference item (soft delete)
  async delete(req, res) {
    try {
      const { id } = req.params;

      const item = await this.Model.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${this.modelName} not found`
        });
      }

      await item.deleteLocation ? 
        await item.deleteLocation() :
        await item.deleteInvestorType ? 
        await item.deleteInvestorType() :
        await item.deleteSector ? 
        await item.deleteSector() :
        await item.deleteIndustry ? 
        await item.deleteIndustry() :
        await item.deleteInvestmentStage ? 
        await item.deleteInvestmentStage() :
        await item.deleteRevenueCriteria();

      res.json({
        success: true,
        message: `${this.modelName} deleted successfully`
      });
    } catch (error) {
      console.error(`Delete ${this.modelName} error:`, error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Search reference items
  async search(req, res) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const items = await this.Model.search(q);

      res.json({
        success: true,
        data: items,
        count: items.length,
        query: q
      });
    } catch (error) {
      console.error(`Search ${this.modelName} error:`, error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = ReferenceController;
