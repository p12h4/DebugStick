import { Block, BlockStates, GameMode, Player, system, world } from '@minecraft/server';
import { PrivilegedExecutor } from './PrivilegedExecutor';


export class DebugStick {
   private static currentPropertyIndex: number = 0;
   private static lastBlockId: string | null = null;
   
   
   /**
    * Initializes event listeners for the Debug Stick functionality.
    */
   public static init(): void {
      world.beforeEvents.playerBreakBlock.subscribe(
         event => {
            const player: Player = event.player;
            const block: Block = event.block;
            const gamemode: GameMode = Object.values(GameMode).find((mode) => [...world.getPlayers({ name: player.name, gameMode: mode })].length);
            
            if (this.isHoldingDebugStick(player) && gamemode == GameMode.creative) {
               event.cancel = true;
               this.getBlockProperty(player, block)
            }
         }
      );
      
      world.beforeEvents.itemUseOn.subscribe(
         event => {
            const player: Player = event.source;
            const block: Block = event.block;
            const gamemode: GameMode = Object.values(GameMode).find((mode) => [...world.getPlayers({ name: player.name, gameMode: mode })].length);
            
            if (this.isHoldingDebugStick(player) && gamemode == GameMode.creative) {
               event.cancel = true;
               this.setBlockProperty(player, block);
            }
         }
      );
   }
   
   /**
    * Checks if the player is holding a Debug Stick.
    * @param player The player to check.
    * @returns True if the player is holding a Debug Stick, false otherwise.
    */
   private static isHoldingDebugStick(player: Player): boolean {
      const itemInHand = player.getComponent("inventory").container.getItem(player.selectedSlot);
      return itemInHand && itemInHand.typeId === "debug:debug_stick";
   }
   
   /**
    * Resets the property index when a new block is selected.
    * @param blockTypeId The ID of the new block.
    */
   private static resetPropertyIndex(blockTypeId: string): void {
      this.currentPropertyIndex = 0;
      this.lastBlockId = blockTypeId;
   }
   
   /**
    * Increments the property index, looping back to the start if necessary.
    * @param length The length of the blockProperties array.
    */
   private static incrementPropertyIndex(length: number): void {
      this.currentPropertyIndex = (this.currentPropertyIndex + 1) % length;
   }
   
   /**
    * Displays a message in the player's action bar.
    * @param player The player to display the message to.
    * @param message The message to be displayed.
    */
   private static showActionBar(player: Player, message: string): void {
      PrivilegedExecutor.runWithPrivileges(() => player.onScreenDisplay.setActionBar(message));
   }
   
   /**
    * Retrieves and displays the current property of the specified block.
    * When a player with a Debug Stick interacts with a block, this method
    * is called to cycle through and display the block's properties.
    * It also manages the property index to ensure the correct property is
    * displayed each time.
    * 
    * If the player interacts with a new block (different from the last one),
    * the method resets the property index to start from the first property.
    * For each call on the same block, it increments the property index to
    * display the next property in the sequence.
    * 
    * If the block has no properties, a message stating so is displayed.
    * Otherwise, it shows the current property's key and value.
    *
    * @param player The player interacting with the block.
    * @param block The block whose properties are being queried.
    */
   private static getBlockProperty(player: Player, block: Block): void {
      if (this.lastBlockId !== block.typeId) {
         this.resetPropertyIndex(block.typeId);
      }

      const blockProperties = Object.entries(block.permutation.getAllStates());

      if (blockProperties.length == 0) {
         const message = `${block.typeId} has no properties`;
         this.showActionBar(player, message);
      } else {
         const currentProperty = blockProperties[this.currentPropertyIndex];
         const [key, value] = currentProperty;

         const message = `selected ${key} (${value})`;
         this.showActionBar(player, message);

         this.incrementPropertyIndex(blockProperties.length);
      }
   }

   /**
    * Sets the current property of the specified block to the next available value.
    * This method changes the value of the property currently selected by the Debug Stick.
    * It cycles through the available values for that property.
    *
    * @param player The player interacting with the block.
    * @param block The block whose property is being modified.
    */
   private static setBlockProperty(player: Player, block: Block): void {  
      if (this.lastBlockId !== block.typeId) {
         this.resetPropertyIndex(block.typeId);
      }
      
      const blockProperties = Object.entries(block.permutation.getAllStates());
      
      if (blockProperties.length == 0) {
         const message = `${block.typeId} has no properties`;
         this.showActionBar(player, message);
      } else {
         const propertyIndex = (this.currentPropertyIndex - 1 + blockProperties.length) % blockProperties.length;
         const currentProperty = blockProperties[propertyIndex];
         const [key, value] = currentProperty;
         const validValues: (string | number | boolean)[] = BlockStates.get(key).validValues;
         
         const nextState = validValues[(validValues.indexOf(value) + 1) % validValues.length];
         const message = `"${key}" to ${nextState}`;
         
         PrivilegedExecutor.runWithPrivileges(() => block.setPermutation(block.permutation.withState(key, nextState)));
         this.showActionBar(player, message);
      }
   }
}