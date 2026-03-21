package CoHUIClass_CaiTien;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class Dataset {
	List<Transaction> transactions;
	public int maxItem = 0;
	
	public Dataset()
	{
		transactions=new ArrayList<Transaction>();
	}
	
    public Dataset(String datasetPath, int maximumTransactionCount) throws IOException 
    {
        transactions = new ArrayList<Transaction>();
        BufferedReader br = new BufferedReader(new FileReader(datasetPath));
        String line;
        int i=0;
        while((line = br.readLine()) != null) { 
			if (line.isEmpty() == true || line.charAt(0) == '#' 
					|| line.charAt(0) == '%' || line.charAt(0) == '@') {
				continue;
			}
			i++;
			transactions.add(createTransaction(line));
        	if(i==maximumTransactionCount) {
        		break;
        	}
			
        }
        //****** Show the number of transactions in this dataset**************************//
        //System.out.println("Transaction count :" +  transactions.size());
        br.close();
    }    
    
    public void add(Transaction tran)
    {
    	transactions.add(tran);
    }
    
    private Transaction createTransaction(String line) {
    	String[] split = line.split(":");
    	
    	// Get the transaction utility
    	int transactionUtility = Integer.parseInt(split[1]);
    	
    	// Get the list of items 
        String[] itemsString = split[0].split(" ");
    	
        // Get the list of item utilities
        String[] itemsUtilitiesString = split[2].split(" ");
    	
        //Create array to store the items and their utilities
        int[] items = new  int[itemsString.length];
        int[] utilities = new  int[itemsString.length];

        // for each item
        for (int i = 0; i < items.length; i++) {
        	//store the item
        	items[i] = Integer.parseInt(itemsString[i]);
        	
        	// store its utility in that transaction
        	utilities[i] = Integer.parseInt(itemsUtilitiesString[i]);
            if(items[i] > maxItem) {
                maxItem = items[i];
            }
        }

		return new Transaction(items, utilities, transactionUtility);
    }

    public List<Transaction> getTransactions() {
        return transactions;
    }

    public int getMaxItem() {
        return maxItem;
    }

    public String toString() {
    	// Create a stringbuilder for storing the string
        StringBuilder datasetContent = new StringBuilder();

        // We will append each transaction to this string builder
        for(Transaction transaction : transactions) {
            datasetContent.append(transaction.toString());
            datasetContent.append("\n");
        }
        // Return the string
        return datasetContent.toString();
    }
    public int getDButility()
    {
    	int u=0;
    	for(Transaction tran:transactions)
    	{
    		u+=tran.transactionUtility;
    	}
    	return u;	
    }
    
    public void savefile(String path) {
    	try {
    	File f = new File(path);
	    FileWriter fw = new FileWriter(f);
    	// Create a stringbuilder for storing the string
        StringBuilder datasetContent = new StringBuilder();

        // We will append each transaction to this string builder
        for(Transaction transaction : transactions) {
            datasetContent.append(transaction.toString());
            datasetContent.append("\n");
        }
        // Return the string
        String s=datasetContent.toString();
        fw.write(s);
        fw.close();
    	} catch(Exception e) {}
    }
}
