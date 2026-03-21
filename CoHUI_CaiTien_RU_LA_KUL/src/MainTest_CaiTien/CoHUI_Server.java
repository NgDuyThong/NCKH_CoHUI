package MainTest_CaiTien;

import CoHUIClass_CaiTien.CoHUI_Algo_NEW;
import CoHUIClass_CaiTien.Dataset;
import CoHUIClass_CaiTien.ItemSet;
import CoHUIClass_CaiTien.ItemSets;

import java.util.Arrays;
import java.util.List;

/**
 * CoHUI Server entry point for Node.js integration.
 * Runs the CoHUI algorithm and outputs results as JSON to stdout.
 *
 * Usage: java -jar CoHUI_Server.jar <inputPath> <maxTransactions> <minUtil> <minCor>
 *
 * All diagnostic/logging output goes to stderr only.
 * stdout contains ONLY the JSON result.
 */
public class CoHUI_Server {

    public static void main(String[] args) {
        try {
            // Validate arguments
            if (args.length < 4) {
                System.err.println("Usage: java -jar CoHUI_Server.jar <inputPath> <maxTransactions> <minUtil> <minCor>");
                System.err.println("  inputPath        - path to the utility transaction database file");
                System.err.println("  maxTransactions   - maximum number of transactions to read (use 99999 for all)");
                System.err.println("  minUtil           - minimum utility threshold (int)");
                System.err.println("  minCor            - minimum correlation threshold (float, e.g. 0.4)");
                System.exit(1);
            }

            String inputPath = args[0];
            int maxTransactions = Integer.parseInt(args[1]);
            int minUtil = Integer.parseInt(args[2]);
            float minCor = Float.parseFloat(args[3]);

            System.err.println("CoHUI Server starting...");
            System.err.println("  Input: " + inputPath);
            System.err.println("  MaxTransactions: " + maxTransactions);
            System.err.println("  MinUtil: " + minUtil);
            System.err.println("  MinCor: " + minCor);

            // Run the algorithm
            CoHUI_Algo_NEW algo = new CoHUI_Algo_NEW();
            long[] rs = algo.runCoHUI(inputPath, maxTransactions, minUtil, minCor);

            long runtimeMs = rs[0];
            long memoryMb = rs[1];
            long cohuiCount = rs[2];

            // Get results
            ItemSets cohuis = algo.getCoHUIs();
            int[] newNamesToOldNames = algo.getNewNamesToOldNames();
            Dataset dataset = algo.getDataset();

            int totalTransactions = dataset.getTransactions().size();
            int totalItems = dataset.getMaxItem();

            System.err.println("  Algorithm completed in " + runtimeMs + " ms");
            System.err.println("  CoHUI count: " + cohuiCount);

            // Build JSON output manually using StringBuilder
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"runtime_ms\":").append(runtimeMs);
            json.append(",\"memory_mb\":").append(memoryMb);
            json.append(",\"cohui_count\":").append(cohuiCount);
            json.append(",\"total_transactions\":").append(totalTransactions);
            json.append(",\"total_items\":").append(totalItems);
            json.append(",\"minutil\":").append(minUtil);
            json.append(",\"mincor\":").append(minCor);
            json.append(",\"cohuis\":[");

            // Iterate over levels, skip level 0 and level 1 (single items)
            List<List<ItemSet>> levels = cohuis.getLevels();
            boolean firstItemset = true;

            for (int level = 2; level < levels.size(); level++) {
                List<ItemSet> itemsets = levels.get(level);
                for (ItemSet itemset : itemsets) {
                    if (!firstItemset) {
                        json.append(",");
                    }
                    firstItemset = false;

                    // Translate renamed IDs back to original IDs
                    int[] renamedItems = itemset.getItems();
                    int[] originalItems = new int[renamedItems.length];
                    for (int i = 0; i < renamedItems.length; i++) {
                        originalItems[i] = newNamesToOldNames[renamedItems[i]];
                    }
                    // Sort the original items for consistent output
                    Arrays.sort(originalItems);

                    json.append("{\"items\":[");
                    for (int i = 0; i < originalItems.length; i++) {
                        if (i > 0) {
                            json.append(",");
                        }
                        json.append(originalItems[i]);
                    }
                    json.append("]");
                    json.append(",\"utility\":").append(itemset.utility);
                    json.append(",\"kulc\":").append(itemset.kulc);
                    json.append("}");
                }
            }

            json.append("]}");

            // Output ONLY the JSON to stdout
            System.out.println(json.toString());
            System.out.flush();

            System.err.println("CoHUI Server completed successfully.");
            System.exit(0);

        } catch (NumberFormatException e) {
            System.err.println("Error: Invalid number format in arguments - " + e.getMessage());
            System.exit(1);
        } catch (java.io.FileNotFoundException e) {
            System.err.println("Error: Input file not found - " + e.getMessage());
            System.exit(1);
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace(System.err);
            System.exit(1);
        }
    }
}
