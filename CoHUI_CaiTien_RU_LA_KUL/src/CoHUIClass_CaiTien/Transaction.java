package CoHUIClass_CaiTien;

import CoHUIClass_CaiTien.Transaction;

public class Transaction {
	public static int[] tempItems = new int[2000];
	public static int[] tempUtilities = new int[2000];
	int offset;	
    int[] items;
    int[] utilities;
    public int transactionUtility; 
    public int Uprefix;
    int prefixUtility;

    public Transaction(int[] items, int[] utilities, int transactionUtility) {
    	this.items = items;
    	this.utilities = utilities;
    	this.transactionUtility = transactionUtility;
    	this.offset = 0;
    	this.prefixUtility = 0;
    }
    
    public Transaction(Transaction transaction, int offsetE) {	
    	this.items = transaction.getItems();
    	this.utilities = transaction.getUtilities();
    	
    	int utilityE = this.utilities[offsetE];

    	this.prefixUtility = transaction.prefixUtility + utilityE;
    	
    	this.transactionUtility = transaction.transactionUtility - utilityE;
    	for(int i = transaction.offset; i < offsetE; i++){
    		this.transactionUtility -= transaction.utilities[i];
    	}
    	this.offset = offsetE+1;
    }
    
    /**
     * Get a string representation of this transaction
     */
     public String toString() {
		StringBuilder buffer = new StringBuilder();
		 for (int i = offset; i < items.length; i++) {
			 buffer.append(items[i]);
			 buffer.append("[");
			 buffer.append(utilities[i]);
			 buffer.append("] ");
		 }
		 buffer.append(" :" +transactionUtility);
		 //buffer.append(" Prefix Utility:" + prefixUtility);
		 return buffer.toString();
	}
 
    public int[] getItems() {
        return items;
    }
    
    public int[] getUtilities() {
        return utilities;
    }

    public int getLastPosition(){
    	return items.length -1;
    }

    public void removeItem(int item)
    {
    	
    	int[] arrTempI=new int[items.length-1];
    	int[] arrTempU=new int[utilities.length-1];
    	int k=-1;
    	for(int j=0;j<items.length;j++)
    	{
    		if(items[j]!=item)
    		{
    			arrTempI[++k]=items[j]; 
    			arrTempU[k]=utilities[j];
    		}
    		else
    		{
    			transactionUtility-=utilities[j];
    		}
    	}
    	//Replace item and utility
    	this.items=arrTempI.clone();   
    	this.utilities=arrTempU.clone();
    }
    
    public void SortTransactionAccordingWTU(int[] Order){
    	int[] temparrI=new int[items.length];
    	int[] temparrU = new int[utilities.length];
    	int k=-1;
    	for(int i=0;i<Order.length;i++)
    	{
    		int util=checkinArray(Order[i], items);
    		if(util!=0)
    		{
    			temparrI[++k]=Order[i];
    			temparrU[k]=util;
    	    }
    	}
    	items=temparrI.clone();
    	utilities=temparrU.clone();	    
    } 
    
    public int checkinArray(int value, int[] arr) {
		for(int i=0;i<arr.length;i++)
		{
			if(arr[i]==value)
			{
				return utilities[i];
			}			
		}
		return 0;
	}
    
	public void removeUnpromisingItems(int[] oldNamesToNewNames) {
    	int i = 0;
    	for(int j=0; j< items.length;j++) {
    		int item = items[j];
    		
    		// Convert from old name to new name
    		int newName = oldNamesToNewNames[item];
    		
    		// if the item is promising (it has a new name)
    		if(newName != 0) {
    			// copy the item and its utility
    			tempItems[i] = newName;
    			tempUtilities[i] = utilities[j];
    			i++;
    		}else{
    			// else subtract the utility of the item
    			transactionUtility -= utilities[j];
    		}
    	}
    	// copy the buffer of items back into the original array
    	this.items = new int[i];
    	System.arraycopy(tempItems, 0, this.items, 0, i);
    	
    	// copy the buffer of utilities back into the original array
    	this.utilities = new int[i];
    	System.arraycopy(tempUtilities, 0, this.utilities, 0, i);
    	
    	// Sort by increasing TWU values
    	insertionSort(this.items, this.utilities);
	}
	
	public void sortDatasetToSupport(int[] oldNamesToNewNames) {
    	int j = 0;
    	for(j=0; j< items.length;j++) {
    		int item = items[j];    		
    		// Convert from old name to new name
    		int newName = oldNamesToNewNames[item];
    		tempItems[j] = newName;   		    	    
    	}
    	System.arraycopy(tempItems, 0, this.items, 0, j);    	    	
    	// Sort by increasing Support values
    	insertionSort(this.items, this.utilities);
	}
	
	public static void insertionSort(int [] items,  int[] utitilies){
		for(int j=1; j< items.length; j++){
			int itemJ = items[j];
			int utilityJ = utitilies[j];
			int i = j - 1;
			for(; i>=0 && (items[i]  > itemJ); i--){
				items[i+1] = items[i];
				utitilies[i+1] = utitilies[i];
			}
			items[i+1] = itemJ;
			utitilies[i+1] = utilityJ;
		}
	}

	public int getRUitem(int index) {
		int tong=0;
		for(int i=index+1; i<items.length; i++)
		{
			tong+=utilities[i];
		}
		return tong;
	}
}
